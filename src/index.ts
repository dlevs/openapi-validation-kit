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

  const compileSchema: typeof compile = (schema, name) => {
    return compile({ ...schema, definitions: spec.definitions }, name, {
      bannerComment: false,
      format: false,
    })
  }

  //
  const lines = await Promise.all(
    Object.values(spec.paths!)
      .flatMap((methods) => Object.values(methods))
      .flatMap(async (method: OpenAPIV2.OperationObject) => {
        let responses = await Promise.all(
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

              // if ('$ref' in schema) {
              //   schema = { $ref: schema.$ref?.replace(/^#/, '. ')}
              // }

              if (schema.$ref) {
                // https://github.com/bcherny/json-schema-to-typescript/issues/132
                // TODO: Document
                schema = {
                  type: 'object',
                  required: ['__REPLACE_ME__'],
                  properties: { __REPLACE_ME__: { $ref: schema.$ref } }, // TODO: Relative refs?
                  additionalProperties: false,
                }
              }

              return compileSchema(
                schema,
                `${method.operationId}ResponseBody${status}`
              )
            })
            .filter(Boolean)
        )

        // TODO: grim
        responses = responses.map((response) =>
          response.replace(
            /\s*export\s+interface\s+(.*?)\s+\{\s*__REPLACE_ME__\s*:\s*(.+?)\s*\}/,
            'export type $1 = $2\n'
          )
        )

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

        const paramsTs = await compileSchema(
          params,
          `${method.operationId}Params`
        )
        const queryTs = await compileSchema(query, `${method.operationId}Query`)
        // TODO: https://github.com/bcherny/json-schema-to-typescript/issues/132
        const bodyTs =
          body && !body.$ref // TODO
            ? await compileSchema(body, `${method.operationId}RequestBody`)
            : `export type ${method.operationId}RequestBody = never\n`
        const headersTs = await compileSchema(
          headers,
          `${method.operationId}Headers`
        )

        return [
          // export namespace ${method.operationId} {
          paramsTs,
          queryTs,
          headersTs,
          bodyTs,
          responses.join('\n\n'),
          // }
        ].join('\n')
      })
  )

  // TODO: Prettier really necessary?
  const file = prettier.format(lines.join('\n'), {
    semi: false,
    singleQuote: true,
    parser: 'typescript',
  })

  // const file = lines.join('\n')

  await fs.ensureDir(path.join(__dirname, '../dist'))
  await fs.writeFile(path.join(__dirname, '../dist/lib.ts'), file)
}

main()
