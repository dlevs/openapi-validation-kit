import fs from 'fs/promises'
import { compile } from 'json-schema-to-typescript'
import prettier from 'prettier'
import type { OpenAPIV3 } from 'openapi-types'
import {
  assertNotRef,
  createSchemaObj,
  parseApiParameters,
  parseApiRequestBody,
  parseApiResponseBody,
} from './lib/schemaUtils'
import { isNotNullish } from './lib/typeUtils'
import { rootPath } from './lib/util'

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

async function main() {
  const spec: OpenAPIV3.Document = JSON.parse(
    await fs.readFile(rootPath('./examples/petstore.json'), 'utf-8')
  )

  // TODO: Move
  const schemaEntries = Object.values(spec.paths!)
    .filter(isNotNullish)
    .map((path) => {
      assertNotRef(path)

      // Pick the actual http methods
      return (
        [
          path.get,
          path.put,
          path.post,
          path.delete,
          path.options,
          path.head,
          path.patch,
          path.trace,
        ]
          // Filter out those that don't exist
          .filter(isNotNullish)
          // Fill in default values from path here, so each method
          // inherits the level above.
          .map((method) => ({
            ...method,
            parameters: [
              ...(path.parameters ?? []),
              ...(method.parameters ?? []),
            ],
          }))
      )
    })
    .flat()
    // Turn the raw OpenAPI operations into a format we can generate
    // schemas and types for.
    .map((method) => {
      const { path, query, header } = parseApiParameters(method.parameters)
      const requestBody = parseApiRequestBody(method.requestBody)
      const responseBody = parseApiResponseBody(method.responses)

      return [
        method.operationId,
        createSchemaObj(
          {
            Params: path,
            Query: query,
            Headers: header,
            RequestBody: requestBody,
            ResponseBody: responseBody,
          },
          { description: method.description }
        ),
      ]
    })

  const schemaObject = Object.fromEntries(schemaEntries)

  const typesCode = await compile(
    {
      ...createSchemaObj(schemaObject),
      // Support `$ref` to components.
      // Unless also added to `definitions`, resolved references are inlined in the
      // outputted types.
      components: spec.components,
      // Things in `definitions` get referenced in the types outputted by
      // "json-schema-to-typescript", instead of inlined. These types are also
      // what people will want to reference in their app code, so this is what
      // we expose.
      //
      // It seems to be a quirk of "json-schema-to-typescript" that a $ref to
      // "#/components/schemas/Foo" will correctly be associated with the
      // generated `Foo` type (technically at path "#/definitions/Foo") - maybe
      // due to being a reference to the same JS object.
      //
      // In short, the output will be like this...
      //
      // export interface Foo { hello: 'world' }
      // export interface Requests {
      //   myReq: { Params: Foo },
      //   myOtherReq: { Params: Foo }
      // }
      //
      // ...instead of this:
      //
      // export interface Requests {
      //   myReq: { Params: { hello: 'world' } },
      //   myOtherReq: { Params: { hello: 'world' } }
      // }
      definitions: spec.components?.schemas,
    } as any,
    'Requests',
    {
      format: false,
      unreachableDefinitions: true,
    }
  )

  const prettifiedTypesCode = prettier.format(typesCode, {
    semi: false,
    singleQuote: true,
    parser: 'typescript',
  })

  try {
    await fs.stat(rootPath('./dist'))
  } catch (err) {
    await fs.mkdir(rootPath('./dist'))
  }

  await Promise.all([
    fs.writeFile(rootPath('./dist/Requests.d.ts'), prettifiedTypesCode),
    fs.writeFile(
      rootPath('./dist/schemas.json'),
      JSON.stringify(schemaObject, null, `\t`)
    ),
  ])
}
