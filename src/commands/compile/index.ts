import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import mkdirp from 'mkdirp'
import { hrtime } from 'node:process'
import ora from 'ora'
import { globby } from 'globby'
import chokidar from 'chokidar'
import colors from 'picocolors'
import { type OpenAPIV3 } from 'openapi-types'
import prettier from 'prettier'
import { compile as compileJsonSchema } from 'json-schema-to-typescript'
import { camelCase, upperFirst } from 'lodash-es'
import { indent, isNotNullish } from '../../lib/utils.js'

interface CommandOptions {
  watch: boolean
  quiet: boolean
  fast: boolean
}

export async function compileCommand(
  source: string,
  outDir: string,
  options: CommandOptions
) {
  let spinner = ora({ isSilent: options.quiet })
  spinner.start()
  spinner.text = 'Compiling...'

  if (options.watch) {
    chokidar.watch(source).on('all', () => {
      compileSafe()
    })
  } else {
    const error = await compileSafe()
    if (error) {
      throw error
    }
  }

  async function compileSafe() {
    const startTime = hrtime.bigint()
    try {
      await compileSpecAndWriteOutput({ source, outDir }, options)
      spinner.succeed(getMessage('Compiled!', startTime))
    } catch (err) {
      spinner.fail(
        getMessage(
          [
            colors.red(`Failed to compile "${source}".`),
            colors.dim(indent((err as Error).stack!)),
          ].join('\n'),
          startTime
        )
      )
      return err as Error
    }
  }

  function getMessage(message: string, startTime: bigint) {
    const endTime = hrtime.bigint()
    const execTimeMs = Number((endTime - startTime) / BigInt(1e6))

    const execTimeFormatted = colors.blue(`[${execTimeMs}ms]`)
    const output = [`${execTimeFormatted} ${message}`]
    const isMultiLine = message.includes('\n')

    if (options.watch) {
      const waitMessage = colors.dim(`Watching for changes...`)
      if (isMultiLine) {
        output.push(indent(waitMessage))
      } else {
        output.push(waitMessage)
      }
    }

    return output.join('\n')
  }
}

export async function compileSpecAndWriteOutput(
  {
    source,
    outDir,
  }: {
    source: string
    outDir: string
  },
  options: CommandOptions
) {
  const spec: OpenAPIV3.Document = JSON.parse(
    await fs.readFile(source, 'utf-8')
  )

  const artifacts = await createSpecArtifacts(spec, options)
  const __dirname = path.dirname(fileURLToPath(import.meta.url))
  const runtimeFiles = await globby(path.join(__dirname, './runtime/*.*'))

  await mkdirp(path.join(outDir, 'data'))

  await Promise.all([
    ...Object.entries(artifacts).map(([filename, data]) => {
      return fs.writeFile(path.join(outDir, 'data', filename), data)
    }),
    ...runtimeFiles.map((runtimeFile) => {
      return fs.copyFile(
        runtimeFile,
        path.join(outDir, path.basename(runtimeFile))
      )
    }),
  ])
}

export async function createSpecArtifacts(
  spec: OpenAPIV3.Document,
  options: CommandOptions
) {
  /**
   * Schemas we'll pass to json-schema-to-typescript to generate
   * the type shape we want, complete with things like `oneOf: []`
   * for unions.
   */
  const schemasPure = parseApiPaths(spec.paths)

  let typesCode = await compileJsonSchema(
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

  /**
   * A less strict data structure than `schemasPure`.
   * This one is easier to pick pieces from to validate individual parts
   * of the request / response separately.
   */
  const schemasTidied = Object.fromEntries(
    Object.entries(schemasPure).map(([operationId, { properties }]) => {
      const { responseBody, ...rest } = properties
      return [
        operationId,
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
    'Requests.d.ts': formatters.typeScript(typesCode, options),
    // TODO: Tidy this file, and don't import from "../src". The validators should all be part of an output bundle, and should output to a JS and TS declaration file ("pre-compiled TS")
    'validators.ts': formatters.typeScript(
      [
        '// This file was automatically generated.',
        '// It looks redundant, but is needed as TypeScript requires',
        '// type guards to have explicit type annotations.',
        '//',
        '// See: https://github.com/microsoft/TypeScript/issues/41047',
        '',
        `import { validators } from '../validatorsBase.js'`,
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
      options
    ),
    'schemas.json': formatters.json(schemasTidied),
  }
}

type SchemaObjectMap = Record<
  string,
  OpenAPIV3.SchemaObject | OpenAPIV3.ReferenceObject
>

const formatters = {
  typeScript(code: string, options: CommandOptions) {
    if (options.fast) {
      return code
    }
    return prettier.format(code, {
      semi: false,
      singleQuote: true,
      parser: 'typescript',
    })
  },
  json(data: unknown) {
    return JSON.stringify(
      data,
      (key: string, value: unknown) => {
        if (key === 'tsType') {
          return undefined
        }
        return value
      },
      '\t'
    )
  },
}

export function parseApiPaths(paths: OpenAPIV3.PathsObject) {
  const entries = Object.values(paths)
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
        // TODO: Assert operationId is defined
        method.operationId!,
        createSchemaObj(
          {
            params: path,
            query,
            headers: header,
            requestBody,
            responseBody,
          },
          { description: method.description }
        ),
      ] as const
    })

  return Object.fromEntries(entries)
}

function parseApiParameters(
  parameters?: (OpenAPIV3.ParameterObject | OpenAPIV3.ReferenceObject)[]
) {
  const outputSchemas = {
    path: createSchemaObj({} as SchemaObjectMap),
    query: createSchemaObj({} as SchemaObjectMap, {
      additionalProperties: true,
    }),
    header: createSchemaObj({} as SchemaObjectMap, {
      additionalProperties: true,
    }),
  }

  parameters?.forEach((param) => {
    assertNotRef(param)

    const { in: paramIn, name, required, description, schema } = param
    const outputSchema =
      outputSchemas[paramIn as keyof typeof outputSchemas] ?? null

    if (outputSchema) {
      outputSchema.properties[name] = {
        description,
        nullable: !required, // TODO: Check this
        ...schema,
      }
      if (required) {
        outputSchema.required.push(name)
      }
    }
  })

  return outputSchemas
}

function parseApiRequestBody(
  body?: OpenAPIV3.ReferenceObject | OpenAPIV3.RequestBodyObject
): OpenAPIV3.SchemaObject | OpenAPIV3.ReferenceObject {
  const emptyRequestBody = {
    description: 'No request body',
    tsType: 'never',
  }

  if (!body) {
    return emptyRequestBody
  }

  assertNotRef(body)

  return body?.content?.['application/json']?.schema ?? emptyRequestBody
}

function parseApiResponseBody(responses: OpenAPIV3.ResponsesObject) {
  // TODO: Document and tidy
  const bodies = Object.entries(responses)
    .map(([status, response]) => {
      if (!response) return null

      assertNotRef(response)

      let { content, description } = response

      const schema = content?.['application/json']?.schema

      // Normalization
      status = status.toUpperCase().endsWith('XX')
        ? // e.g. "4XX"
          status.toUpperCase()
        : // e.g. "200", "default"
          status.toLowerCase()

      return createSchemaObj({
        status: { enum: [status], description },
        body: schema ?? ({ tsType: 'unknown' } as any), // TODO: Type this properly
      })
    })
    .filter(isNotNullish)

  // TODO: Check for method.operationId
  // TODO: Check. Document. Add operation ID in here
  if (bodies.length === 0) {
    throw new Error(`No responses found for operation.`)
  }

  return {
    oneOf: bodies,
  }
}

export function createSchemaObj<
  T extends Record<string, OpenAPIV3.SchemaObject | OpenAPIV3.ReferenceObject>
>(properties: T, options?: Partial<OpenAPIV3.SchemaObject>) {
  return {
    additionalProperties: false,
    ...options,
    type: 'object',
    required: Object.keys(properties),
    properties,
  } as const
}

// TODO: Try to remove this function
export function assertNotRef<T>(
  potentialRef: T | OpenAPIV3.ReferenceObject
): asserts potentialRef is T {
  if ('$ref' in potentialRef) {
    throw new Error(
      `$ref found in unexpected place. $refs are not yet supported at this level.`
    )
  }
}
