import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import mkdirp from 'mkdirp'
import { hrtime } from 'node:process'
import ora from 'ora'
import { execa } from 'execa'
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
  const spinner = ora({ isSilent: options.quiet })

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
    spinner.start()
    spinner.text = 'Compiling...'

    const startTime = hrtime.bigint()
    try {
      await compileSpecAndWriteOutput({ source, outDir }, options)
      try {
        await fs.stat(path.join(outDir, 'node_modules'))
      } catch (err) {
        spinner.text = 'Bundle compiled. Installing dependencies...'
        await execa('npm', ['install'], { cwd: outDir })
      }
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
    } finally {
      spinner.stop()
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
  const runtimeFilesAbsolute = await globby(
    path.join(__dirname, './runtime/**/*')
  )
  const runtimeFiles = runtimeFilesAbsolute.map((filename) => {
    return {
      source: filename,
      destination: path.join(
        outDir,
        path.relative(path.join(__dirname, 'runtime'), filename)
      ),
    }
  })

  await mkdirp(path.join(outDir, 'lib'))

  await Promise.all([
    ...Object.entries(artifacts).map(([filename, data]) => {
      return fs.writeFile(path.join(outDir, filename), data)
    }),
    ...runtimeFiles.map(({ source, destination }) => {
      return fs.copyFile(source, destination)
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
    // Entry point
    'index.ts': formatters.typeScript(
      `
        export * from './validators.js'
        export * from './types.js'

        // Remap export so that we avoid name clash with the user's generated types.
        export { ValidationError as OpenAPIKitValidationError } from './lib/getValidators.js'
      `,
      options
    ),
    // Types
    'types.js': 'export {}\n', // Prevent error. We export only types from this file.
    'types.d.ts': formatters.typeScript(typesCode, options),
    // Validators
    'validators.js': formatters.typeScript(
      getValidatorsCode(schemasTidied, false),
      options
    ),
    'validators.d.ts': formatters.typeScript(
      getValidatorsCode(schemasTidied, true),
      options
    ),
    // Express
    'express.js': formatters.typeScript(getExpressCode(false), options),
    'express.d.ts': formatters.typeScript(getExpressCode(true), options),
    // Misc
    'schemas.js': formatters.typeScript(
      `export default ${JSON.stringify(schemasTidied, null, 2)}`,
      options
    ),
    'package.json': formatters.json({
      description: 'Automatically generated OpenAPI validation library',
      type: 'module',
      export: './index.js',
      dependencies: {
        ajv: '^8.8.2',
        'ajv-formats': '^2.1.1',
        'openapi-types': '^10.0.0',
      },
      peerDependencies: {
        '@types/express': '4.x',
      },
      peerDependenciesMeta: {
        '@types/express': {
          optional: true,
        },
      },
    }),
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

const HTTP_METHODS = [
  'get',
  'put',
  'post',
  'delete',
  'options',
  'head',
  'patch',
  'trace',
] as const

export function parseApiPaths(paths: OpenAPIV3.PathsObject) {
  const entries = Object.entries(paths)
    .flatMap(([path, pathMeta]) => {
      // Filter out null values.
      if (!pathMeta) {
        return []
      }

      assertNotRef(pathMeta)

      // Pick the actual http methods
      return (
        HTTP_METHODS
          // Fill in default values from path here, so each method
          // inherits the level above.
          .flatMap((method) => {
            const methodMeta = pathMeta[method]

            // Filter out those that don't exist
            if (!methodMeta) {
              return []
            }

            return {
              ...methodMeta,
              operationId:
                methodMeta.operationId ?? `${method.toUpperCase()} ${path}`,
              parameters: [
                ...(pathMeta.parameters ?? []),
                ...(methodMeta.parameters ?? []),
              ],
            }
          })
      )
    })
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

  // TODO: Check this... Seems a bit dodgy
  if (bodies.length === 0) {
    // throw new Error(`No responses found for operation.`)
    return {
      oneOf: [
        createSchemaObj({
          status: { enum: ['200'], description: 'No response body defined' },
          body: { tsType: 'unknown' } as any, // TODO: Type this properly
        }),
      ],
    }
  }

  return {
    oneOf: bodies,
  }
}

/**
 * Create the validators code.
 */
function getValidatorsCode(schemas: Record<string, unknown>, types: boolean) {
  return [
    '// This file was automatically generated.',
    '// It looks redundant, but is needed as TypeScript requires',
    '// type guards to have explicit type annotations.',
    '//',
    '// See: https://github.com/microsoft/TypeScript/issues/41047',
    '',
    `import { getValidators } from './lib/getValidators.js'`,
    `import schemas from './schemas.js'`,
    types
      ? `
        import type { ResponseBody } from './lib/types.js'
        import type { Requests } from './types.js'

        export declare const validators: Readonly<{
          [ID in keyof Requests]: Readonly<{
            params: (data: any) => asserts data is Requests[ID]['params']
            query: (data: any) => asserts data is Requests[ID]['query']
            headers: (data: any) => asserts data is Requests[ID]['headers']
            requestBody: (data: any) => asserts data is Requests[ID]['requestBody']
            responseBody: <Status extends number>(
              data: unknown,
              status: Status
            ) => asserts data is ResponseBody<Requests[ID], Status>
          }>
        }>
    `
      : '\nexport const validators = getValidators(schemas)',
    ...Object.keys(schemas).flatMap((id) => {
      const createCodeExport = (prop: string) => {
        return `export const ${camelCase(
          `validate${upperFirst(id)}${upperFirst(prop)}`
        )} = validators[${JSON.stringify(id)}].${prop}`
      }
      const createTypeExport = (prop: string) => {
        return `export declare const ${camelCase(
          `validate${upperFirst(id)}${upperFirst(prop)}`
        )}: typeof validators[${JSON.stringify(id)}][${JSON.stringify(prop)}]`
      }
      const createExport = types ? createTypeExport : createCodeExport

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
  ].join('\n')
}

/**
 * Create the express code.
 *
 * It's really just static, but it's not a valid TS file as the imports are for things
 * that don't exist before this script is run.
 */
function getExpressCode(types: boolean) {
  if (types) {
    return `
      // This file was automatically generated.

      import type { WrapHandlerWithValidation } from './lib/getExpressWrappers.js'
      import type { Requests } from './types.js'

      export declare const wrapRoute: Readonly<{
        [ID in keyof Requests]: WrapHandlerWithValidation<Requests[ID]>
      }>
    `
  }
  return `
    // This file was automatically generated.

    import { validators } from './validators.js'
    import { getExpressWrappers } from './lib/getExpressWrappers.js'
    export const wrapRoute = getExpressWrappers(validators)
  `
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
