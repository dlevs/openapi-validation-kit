import fs from 'fs-extra'
import path from 'path'
import { OpenAPIV2 } from 'openapi-types'
import { appendFile } from 'fs'
import { compile } from 'json-schema-to-typescript'
import SwaggerParser from 'swagger-parser'
import prettier from 'prettier'

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
      let responses = Object.entries(method.responses)
        .map(([status, response]) => {
          if (!response) return null

          if ('$ref' in response) {
            return null //TODO
          }

          let { schema } = response

          if (!schema) {
            return null
          }

          return [`${method.operationId}ResponseBody${status}`, schema]
        })
        .filter(Boolean)

      const params: OpenAPIV2.SchemaObject = {
        type: 'object',
        required: [],
        additionalProperties: false,
        properties: {},
      }
      const query: OpenAPIV2.SchemaObject = {
        type: 'object',
        required: [],
        additionalProperties: false,
        properties: {},
      }
      const headers: OpenAPIV2.SchemaObject = {
        type: 'object',
        required: [],
        additionalProperties: false,
        properties: {},
      }
      let body: null | OpenAPIV2.SchemaObject = null

      method
        .parameters! // TODO: !
        .forEach((param) => {
          if ('$ref' in param) {
            return null //TODO
          }

          const schema =
            param.in === 'path'
              ? params
              : param.in === 'query'
              ? query
              : param.in === 'headers'
              ? headers
              : null

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
      const methodSchemaObject = Object.fromEntries([
        ['Params', params],
        ['Query', query],
        ['Headers', headers],
        ['RequestBody', body ? body : { type: 'null' }], // TODO: Better type? Like `never`?
        ...responses,
      ])

      return [
        method.operationId,
        {
          type: 'object',
          properties: methodSchemaObject,
          required: Object.keys(methodSchemaObject),
          additionalProperties: false,
        },
      ]
    })

  const schemaObject = Object.fromEntries(schemaEntries)

  const types = await compile(
    {
      type: 'object',
      properties: schemaObject,
      required: Object.keys(schemaObject),
      additionalProperties: false,
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
