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

function rootPath(...pathComponents: string[]) {
  return path.join(__dirname, '../', ...pathComponents)
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
      let responseBodies = {
        oneOf: Object.entries(method.responses)
          .map(([status, response]) => {
            if (!response) return null

            if ('$ref' in response) {
              //TODO
              throw new Error(
                `$ref found for operation ${method.operationId}. $refs are not yet supported at this level.`
              )
            }

            let { schema, description } = response

            return createSchemaObj({
              status:
                status === 'default'
                  ? { type: 'number', description }
                  : { const: Number(status), description },
              body: schema ?? { tsType: 'unknown' },
            })
          })
          .filter(Boolean),
      }

      // TODO: Check. Document
      if (responseBodies.oneOf.length === 0) {
        throw new Error(
          `No responses found for operation ${method.operationId}`
        )
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
                    description: 'No request body',
                    tsType: 'never',
                  },
            ],
            ['ResponseBody', schemas.responseBodies],
          ]),
          { description: method.description }
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
      unreachableDefinitions: true,
    }
  )

  // TODO: Prettier really necessary?
  const file = prettier.format(typesCode, {
    semi: false,
    singleQuote: true,
    parser: 'typescript',
  })

  await fs.ensureDir(rootPath('./dist'))
  await Promise.all([
    fs.writeFile(rootPath('./dist/Requests.d.ts'), file),
    fs.writeFile(
      rootPath('./dist/schemas.json'),
      JSON.stringify(schemaObject, null, `\t`)
    ),
  ])
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
