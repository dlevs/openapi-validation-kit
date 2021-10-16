import { OpenAPIV3 } from 'openapi-types'

export function createSchemaObj(
  properties: Record<string, OpenAPIV3.SchemaObject>,
  options?: Partial<OpenAPIV3.SchemaObject>
) {
  return {
    ...options,
    type: 'object',
    additionalProperties: false,
    required: Object.keys(properties),
    properties,
  }
}

// TODO: Try to remove this function
export function assertNotRef<
  T extends OpenAPIV3.SchemaObject | OpenAPIV3.RequestBodyObject
>(potentialRef: T | OpenAPIV3.ReferenceObject): asserts potentialRef is T {
  if ('$ref' in potentialRef) {
    throw new Error(
      `$ref found in unexpected place. $refs are not yet supported at this level.`
    )
  }
}
