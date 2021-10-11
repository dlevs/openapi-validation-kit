import fs from 'fs-extra'
import path from 'path'
import { OpenAPIV2 } from 'openapi-types'
import { compile } from 'json-schema-to-typescript'
import prettier from 'prettier'

const createSchemaObj = (
  properties: Record<string, OpenAPIV2.SchemaObject>
) => {
  return {
    type: 'object',
    required: Object.keys(properties),
    additionalProperties: false,
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
      const responseBody = createSchemaObj(
        Object.fromEntries(
          Object.entries(method.responses)
            .map(([status, response]) => {
              if (!response) return null

              if ('$ref' in response) {
                return null //TODO
              }

              let { schema } = response

              if (!schema) {
                return null
              }

              return [status, schema]
            })
            .filter(Boolean)
        )
      )

      const schemas = {
        responseBody,
        path: createSchemaObj({}),
        query: createSchemaObj({}),
        header: createSchemaObj({}),
      }
      let body: null | OpenAPIV2.SchemaObject = null

      method
        .parameters! // TODO: !
        .forEach((param) => {
          if ('$ref' in param) {
            return null //TODO
          }

          const schema =
            (schemas as Record<string, OpenAPIV2.SchemaObject>)[param.in] ??
            null

          if (schema) {
            schema.properties[param.name] = {
              ...param,
              nullable: !param.required, // TODO: Check this
            }
            if (param.required) {
              schema.required?.push(param.name)
            }
          } else if (param.in === 'body') {
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
            ['RequestBody', body ? body : { type: 'null', nullable: true }], // TODO: Better type? Like `never`?
            ['ResponseBody', schemas.responseBody],
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
    import type { JSONSchemaType } from 'ajv'
    import type { Request, Response, NextFunction } from 'express'
  `

  const schemasCode = `const schemas = ${JSON.stringify(
    schemaObject,
    null,
    2
  )} as unknown as {
    [ID in OperationId]: {
      properties: {
        Params: JSONSchemaType<Requests[ID]['Params']>
        Query: JSONSchemaType<Requests[ID]['Query']>
        Headers: JSONSchemaType<Requests[ID]['Headers']>
        RequestBody: JSONSchemaType<Requests[ID]['RequestBody']>
        ResponseBody: {
          [Status in OperationId[ID]['ResponseBody']]: JSONSchemaType<
            Requests[ID]['ResponseBody']
          >
        }
      }
    }
  }`

  const handlerTypes = `
    interface ResponseSend<T> {
      send(data: T): void
      json(data: T): void
    }
    
    type OperationId = keyof Requests
    
    type ResponseStatus<
      ID extends OperationId,
      Code extends number
    > = Code extends keyof Requests[ID]['ResponseBody']
      ? Requests[ID]['ResponseBody'][Code]
      : never
    
    type ValidatedRequest<ID extends OperationId> = Request<
      Requests[ID]['Params'],
      Requests[ID]['ResponseBody'][keyof Requests[ID]['ResponseBody']],
      Requests[ID]['RequestBody'],
      Requests[ID]['Query']
    >

    type ValidatedResponse<ID extends OperationId> = Omit<
      Response,
      'status' | 'send' | 'json'
    > & {
      status<Status extends keyof Requests[ID]['ResponseBody']>(
        code: Status
      ): ResponseSend<Requests[ID]['ResponseBody'][Status]>
    } & ResponseSend<ResponseStatus<ID, 200>>

    type ValidatedResponseReturn<ID extends OperationId> = UnionizeResponses<
      Requests[ID]['ResponseBody']
    >
    
    type UnionizeResponses<ResponseDictionary extends object> = {
      [Status in keyof ResponseDictionary]: {
        status: Status
        body: ResponseDictionary[Status]
      }
    }[keyof ResponseDictionary]
    
    function createValidationHandlerWrapper <ID extends OperationId> (
      operationId: ID
    ) {
      return function wrapHandlerWithValidation (
        handler: (
          req: ValidatedRequest<ID>,
          res: ValidatedResponse<ID>,
          next: NextFunction
        ) => Promise<ValidatedResponseReturn<ID>>
      ) {
        // TODO: HOC - read function name here for stacktrace
        return function handlerWithValidation (req: Request, res: Response, next: NextFunction) {
          // TODO: validation here
          return handler(req, res, next)
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

  // interface GetUserHandler {
  //   (
  //     req: Request<
  //       GetUser.Params,
  //       GetUser.ResponseBody[200 | 404],
  //       GetUser.RequestBody,
  //       GetUser.Query
  //     >,
  //     // TODO: Make generic
  //     res: Omit<
  //       Response<GetUser.ResponseBody[200]>,
  //       'status' | 'send' | 'json'
  //     > & {
  //       status(code: 200): ResponseSend<GetUser.ResponseBody[200]>
  //       status(code: 404): ResponseSend<GetUser.ResponseBody[404]>
  //     } & ResponseSend<GetUser.ResponseBody[200]>,
  //     next: NextFunction
  //   ): Promise<
  //     | { status: 200; body: GetUser.ResponseBody[200] }
  //     | { status: 404; body: GetUser.ResponseBody[404] }
  //   >
  // }

  // TODO: Prettier really necessary?
  const file = prettier.format(
    [importsCode, schemasCode, typesCode, handlerTypes].join('\n'),
    {
      semi: false,
      singleQuote: true,
      parser: 'typescript',
    }
  )

  // const file = lines.join('\n')

  await fs.ensureDir(path.join(__dirname, '../dist'))
  await fs.writeFile(path.join(__dirname, '../dist/lib.ts'), file)
}

main()
