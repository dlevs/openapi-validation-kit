import fs from 'fs-extra'
import path from 'path'
import { OpenAPIV2 } from 'openapi-types'
import { compile } from 'json-schema-to-typescript'
import prettier from 'prettier'

const createSchemaObj = (
  properties: Record<string, OpenAPIV2.SchemaObject>,
  options?: Partial<OpenAPIV2.SchemaObject>
): OpenAPIV2.SchemaObject => {
  return {
    type: 'object',
    additionalProperties: false,
    required: Object.keys(properties),
    ...options,
    properties,
  }
}

async function main() {
  // TODO: Validate spec?
  // const spec: OpenAPIV2 = await SwaggerParser.dereference(
  //   await fs.readJSON(path.join(__dirname, '../examples/petstore.json'))
  // )

  const spec: OpenAPIV2.Document = await fs.readJSON(
    path.join(__dirname, '../examples/petstore.json')
  )

  //
  const schemaEntries = Object.values(spec.paths!)
    .flatMap((methods) => Object.values(methods))
    .map((method: OpenAPIV2.OperationObject) => {
      // TODO: Tidy
      const responseBodies = {
        oneOf: Object.entries(method.responses)
          .map(([status, response]) => {
            if (!response) return null

            if ('$ref' in response) {
              return null //TODO
            }

            let { schema } = response

            if (!schema) {
              return null
            }

            return createSchemaObj({
              status: { type: 'string', const: status },
              body: schema,
            })
          })
          .filter(Boolean),
      }

      const schemas = {
        responseBodies,
        path: createSchemaObj({}),
        query: createSchemaObj({}, { additionalProperties: true }),
        header: createSchemaObj({}, { additionalProperties: true }),
      }
      let body: null | OpenAPIV2.SchemaObject = null

      method
        .parameters! // TODO: !
        .forEach((param) => {
          if ('$ref' in param) {
            return null //TODO
          }
          // TODO: pick valid props instead of omitting invalid ones
          const {
            in: paramIn,
            name,
            required,
            format,
            collectionFormat,
            ...paramRest
          } = param

          const schema =
            (schemas as Record<string, OpenAPIV2.SchemaObject>)[paramIn] ?? null

          if (schema) {
            schema.properties[name] = {
              ...paramRest,
              // Remove number formats (int64), and other things AJV won't enforce.
              format: paramRest.type === 'string' ? format : undefined,
              nullable: !required, // TODO: Check this
            }
            if (required) {
              schema.required?.push(name)
            }
          } else if (paramIn === 'body') {
            body = param.schema
          }
        })

      // TODO: Put these in an object schema or namespace...
      // { GetUsers: { Params: ..., Query: ... }}

      return [
        method.operationId,
        createSchemaObj(
          Object.fromEntries([
            ['Params', schemas.path],
            ['Query', schemas.query],
            ['Headers', schemas.header],
            [
              'RequestBody',
              body
                ? body
                : // TODO: Is there a better way to do this? Or just ignore the body?
                  {
                    not: { oneOf: [{ type: 'string' }, { type: 'object' }] },
                  },
            ], // TODO: Better type? Like `never`?
            ['ResponseBodies', schemas.responseBodies],
          ])
        ),
      ]
    })

  const schemaObject = Object.fromEntries(schemaEntries)

  const typesCode = await compile(
    {
      ...createSchemaObj(schemaObject),
      definitions: spec.definitions,
    },
    'Requests',
    {
      bannerComment: false,
      format: false,
    }
  )

  const importsCode = `
    import Ajv from 'ajv'
    import type { Request, Response, NextFunction } from 'express'

    // TODO: Options
    const ajv = new Ajv({ coerceTypes: 'array', useDefaults: 'empty' })
  `

  const schemasCode = `const schemas = ${JSON.stringify(schemaObject, null, 2)}`

  const handlerTypes = `
    interface ResponseSend<T> {
      send(data: T): void
      json(data: T): void
    }
    
    type OperationId = keyof Requests
    
    type ResponseStatus<
      ID extends OperationId,
      Code extends number
    > = Code extends keyof Requests[ID]['ResponseBodies']
      ? Requests[ID]['ResponseBodies'][Code]
      : never
    
    type ValidatedRequest<ID extends OperationId> = Request<
      Requests[ID]['Params'],
      Requests[ID]['ResponseBodies'][keyof Requests[ID]['ResponseBodies']],
      Requests[ID]['RequestBody'],
      Requests[ID]['Query']
    >

    type ValidatedResponse<ID extends OperationId> = Omit<
      Response,
      'status' | 'send' | 'json'
    > & {
      status<Status extends keyof Requests[ID]['ResponseBodies']>(
        code: Status
      ): ResponseSend<Requests[ID]['ResponseBodies'][Status]>
    } & ResponseSend<ResponseStatus<ID, 200>>

    type ValidatedResponseReturn<ID extends OperationId> = UnionizeResponses<
      Requests[ID]['ResponseBodies']
    >
    
    type UnionizeResponses<ResponseDictionary extends object> = {
      [Status in keyof ResponseDictionary]: {
        status: Status
        body: ResponseDictionary[Status]
      }
    }[keyof ResponseDictionary]
    
    function getValidators<ID extends OperationId>(operationId: ID) {
      type Req = Requests[ID]
      const { Params, Query, Headers, RequestBody, ResponseBodies } =
        schemas[operationId].properties
    
      return {
        params: ajv.compile<Req['Params']>(Params),
        query: ajv.compile<Req['Query']>(Query),
        headers: ajv.compile<Req['Headers']>(Headers),
        requestBody: ajv.compile<Req['Query']>(RequestBody),
      }
    }
    
    function createValidationHandlerWrapper<ID extends OperationId>(
      operationId: ID
    ) {
      let validate: ReturnType<typeof getValidators>
    
      return function wrapHandlerWithValidation(
        handler: (
          req: ValidatedRequest<ID>,
          res: ValidatedResponse<ID>,
          next: NextFunction
        ) => Promise<ValidatedResponseReturn<ID>>
      ) {
        validate = validate || getValidators(operationId)
    
        // TODO: HOC - read function name here for stacktrace
        return function handlerWithValidation(
          req: Request,
          res: Response,
          next: NextFunction
        ) {
          // // type of validate extends \`(data: any) => data is Foo\`
          // const data: any = { foo: 1 }
          if (!validate.params(req.params)) {
            return next(
              new Error(
                \`Validation error: Request path params \${validate.params.errors[0].message}\`
              )
            )
          }

          if (!validate.headers(req.headers)) {
            return next(
              new Error(
                \`Validation error: Headers \${validate.headers.errors[0].message}\`
              )
            )
          }

          if (!validate.query(req.query)) {
            return next(
              new Error(
                \`Validation error: Request query \${validate.query.errors[0].message}\`
              )
            )
          }

          if (!validate.requestBody(req.body)) {
            return next(
              new Error(
                \`Validation error: Request body \${validate.requestBody.errors[0].message}\`
              )
            )
          }

          // TODO: Class for this
          const modifiedRes = {
            ...res,
            status(status) {
              console.log(status)
              return {
                ...modifiedRes,
                send(body) {
                  console.log(body)
                  // TODO: Check this response exists
                  if (!validate.responseBodies[status](body)) {
                    return next(
                      new Error(
                        \`Validation error: Response body \${validate.responseBodies[status].errors[0].message}\`
                      )
                    )
                  }
                  res.status(status).send(body)
                  return modifiedRes
                }
              }
            }
          }
    
          return handler(req, modifiedRes, next)
        }
      }
    }
    
  
    // TODO: Prepend things to prevent collisions
    interface ResponseSend<T> {
      send(data: T): void
      json(data: T): void
    }

    export const validate = {
      ${schemaEntries
        .map(([operationId, schemas]) => {
          return `${operationId}: createValidationHandlerWrapper('${operationId}')`
        })
        .join(',\n')}
    }
  `

  // TODO: Prettier really necessary?
  const file = [importsCode, schemasCode, typesCode, handlerTypes].join('\n') //prettier.format(
  //   {
  //     semi: false,
  //     singleQuote: true,
  //     parser: 'typescript',
  //   }
  // )

  // const file = lines.join('\n')

  await fs.writeFile(path.join(__dirname, '../src/lib.temp.ts'), file)
}

main()
