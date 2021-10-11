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
            schema.properties[param.name] = param
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
            ['RequestBody', body ? body : { type: 'null' }], // TODO: Better type? Like `never`?
            ['ResponseBody', schemas.responseBody],
          ])
        ),
      ]
    })

  const schemaObject = Object.fromEntries(schemaEntries)

  const types = await compile(
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

  // TODO: Prettier really necessary?
  const file = prettier.format(types, {
    semi: false,
    singleQuote: true,
    parser: 'typescript',
  })

  // const file = lines.join('\n')

  await fs.ensureDir(path.join(__dirname, '../dist'))
  await fs.writeFile(path.join(__dirname, '../dist/lib.ts'), file)
}

main()
