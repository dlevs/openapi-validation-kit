import { OpenAPIV3 } from 'openapi-types'
import { isNotNullish } from './typeUtils'

type SchemaObjectMap = Record<
  string,
  OpenAPIV3.SchemaObject | OpenAPIV3.ReferenceObject
>

export function parseApiParameters(
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

export function parseApiRequestBody(
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

export function parseApiResponseBody(responses: OpenAPIV3.ResponsesObject) {
  const bodies = Object.entries(responses)
    .map(([status, response]) => {
      if (!response) return null

      assertNotRef(response)

      let { content, description } = response

      const schema = content?.['application/json']?.schema

      return createSchemaObj({
        status:
          status === 'default'
            ? { type: 'number', description }
            : { enum: [Number(status)], description },
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
    ...options,
    type: 'object',
    additionalProperties: false,
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
