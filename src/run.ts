import { compile } from 'json-schema-to-typescript'
import prettier from 'prettier'
import type { OpenAPIV3 } from 'openapi-types'
import { createSchemaObj, parseApiPaths } from './lib/schemaUtils.js'
import { camelCase, upperFirst } from 'lodash-es'

// TODO: Rename
export async function run(spec: OpenAPIV3.Document) {
  /**
   * Schemas we'll pass to json-schema-to-typescript to generate
   * the type shape we want, complete with things like `oneOf: []`
   * for unions.
   */
  const schemasPure = parseApiPaths(spec.paths)

  let typesCode = await compile(
    {
      ...createSchemaObj(schemasPure),
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

  /**
   * A less strict data structure than `schemasPure`.
   * This one is easier to pick pieces from to validate individual parts
   * of the request / response separately.
   */
  const schemasTidied = Object.fromEntries(
    Object.entries(schemasPure).map(([opetationId, { properties }]) => {
      const { responseBody, ...rest } = properties
      return [
        opetationId,
        {
          ...rest,
          responseBody: Object.fromEntries(
            responseBody.oneOf.map((response) => {
              return [
                response.properties.status.enum[0],
                response.properties.body,
              ]
            })
          ),
        },
      ]
    })
  )

  return {
    'Requests.d.ts': prettifiedTypesCode,
    // TODO: Tidy this file, and don't import from "../src". The validators should all be part of an output bundle, and should output to a JS and TS declaration file ("pre-compiled TS")
    'validators.ts': [
      '// This file was automatically generated.',
      '// It looks redundant, but is needed as TypeScript requires',
      '// type guards to have explicit type annotations.',
      '//',
      '// See: https://github.com/microsoft/TypeScript/issues/41047',
      '',
      `import { validators } from '../src/lib/runtime/validators'`,
      '',
      ...Object.keys(schemasTidied).flatMap((id) => {
        const createExport = (prop: string) => {
          return `export const ${camelCase(
            `validate${upperFirst(id)}${upperFirst(prop)}`
          )}: typeof validators[${JSON.stringify(id)}][${JSON.stringify(
            prop
          )}] = validators[${JSON.stringify(id)}].${prop}`
        }

        return [
          createExport('params'),
          createExport('query'),
          createExport('headers'),
          createExport('requestBody'),
          createExport('responseBody'),
          '',
        ]
      }),
      '',
    ].join('\n'),
    'schemas.json': JSON.stringify(
      schemasTidied,
      (key, value) => {
        if (key === 'tsType') {
          return undefined
        }
        return value
      },
      `\t`
    ),
  }
}
