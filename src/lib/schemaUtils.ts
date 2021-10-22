import { partition, sortBy } from 'lodash'
import { OpenAPIV3 } from 'openapi-types'
import { isNotNullish } from './typeUtils'

type SchemaObjectMap = Record<
  string,
  OpenAPIV3.SchemaObject | OpenAPIV3.ReferenceObject
>

// TODO: Move
export const statusCode1XX = [100, 101, 102, 103] as const
export const statusCode2XX = [
  200, 201, 202, 203, 204, 205, 206, 207, 208, 226,
] as const
export const statusCode3XX = [300, 301, 302, 303, 304, 305, 307, 308] as const
export const statusCode4XX = [
  400, 401, 402, 403, 404, 405, 406, 407, 408, 409, 410, 411, 412, 413, 414,
  415, 416, 417, 418, 421, 422, 423, 424, 425, 426, 428, 429, 431, 451,
] as const
export const statusCode5XX = [
  500, 501, 502, 503, 504, 505, 506, 507, 508, 509, 510, 511,
] as const

// TODO: Use node's list from 'http' lib
const allStatusCodes: ReadonlyArray<number> = [
  ...statusCode1XX,
  ...statusCode2XX,
  ...statusCode3XX,
  ...statusCode4XX,
  ...statusCode5XX,
]

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
  let remainingStatus = [...allStatusCodes]

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
