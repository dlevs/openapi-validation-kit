import Ajv, { AnySchema, ErrorObject } from 'ajv'
import { AnyValidateFunction } from 'ajv/dist/core.js'
import addFormats from 'ajv-formats'
import { OpenAPIV3 } from 'openapi-types'

// TODO: Move
interface RequestSchema {
  params: OpenAPIV3.SchemaObject
  query: OpenAPIV3.SchemaObject
  headers: OpenAPIV3.SchemaObject
  requestBody: OpenAPIV3.SchemaObject
  responseBody: Record<string, OpenAPIV3.SchemaObject>
}

// interface RequestType {
//   params: Record<string, unknown>
//   query: Record<string, unknown>
//   headers: Record<string, unknown>
//   requestBody: unknown
//   responseBody: { status: string; body: unknown }
// }

// TODO: Options
export function getValidators<Schema extends Record<string, RequestSchema>>(
  schemas: Schema
) {
  const ajv = new Ajv({ coerceTypes: 'array', useDefaults: 'empty' })
  addFormats(ajv)

  const addSchema = (
    schema: AnySchema,
    id: string,
    subjectSpecific: string,
    subjectEntire: string
  ) => {
    ajv.addSchema(schema, id)

    schemaMeta[id] = {
      subjectSpecific,
      subjectEntire,
      getValidate() {
        // Compilation happens at this point, the first time it is called.
        return ajv.getSchema(id)!
      },
    }
  }

  for (const [
    operationId,
    { params, query, headers, requestBody, responseBody },
  ] of Object.entries(schemas)) {
    addSchema(
      params,
      `${operationId}:params`,
      'Request path parameter',
      'Request path'
    )
    addSchema(
      query,
      `${operationId}:query`,
      'Request query parameter',
      'Request query'
    )
    addSchema(
      headers,
      `${operationId}:headers`,
      'Request header',
      'Request headers'
    )
    addSchema(
      requestBody,
      `${operationId}:requestBody`,
      'Request body property',
      'Request body'
    )

    for (const [status, responseBodySchema] of Object.entries(responseBody)) {
      addSchema(
        responseBodySchema,
        `${operationId}:responseBody:${status}`,
        'Response body property',
        'Response body'
      )
    }
  }

  return Object.fromEntries(
    // TODO: Object.keys
    Object.entries(schemas).map(([operationId]) => {
      // TODO: It's all a bit convoluted - why loop through above, and here?
      return [
        operationId,
        {
          params: createValidator(`${operationId}:params`),
          query: createValidator(`${operationId}:query`),
          headers: createValidator(`${operationId}:headers`),
          requestBody: createValidator(`${operationId}:requestBody`),
          responseBody: (data: unknown, status: number) => {
            const responses = schemas[operationId].responseBody as {
              [status: string]: AnySchema
            }
            const statusCategory = `${String(status)[0]}XX`
            const statusKey =
              status in responses
                ? status
                : statusCategory in responses
                ? statusCategory
                : 'default'

            // TODO: Too convoluted
            return createValidator(`${operationId}:responseBody:${statusKey}`)(
              data
            )
          },
        },
      ]
    })
  )
}

interface SchemaMeta {
  subjectSpecific: string
  subjectEntire: string
  getValidate(): AnyValidateFunction
}

const schemaMeta: Record<string, SchemaMeta> = {}

export class ValidationError extends Error {
  errors: ErrorObject[]

  constructor(errors: ErrorObject[], schemaMeta: SchemaMeta) {
    const message = errors
      ?.map((error) => {
        if (error.instancePath) {
          return `${schemaMeta.subjectSpecific} '${error.instancePath
            .replace(/^\//, '')
            .replace(/\//g, '.')}' ${error.message}`
        }
        return `${schemaMeta.subjectEntire} ${error.message}`
      })
      .join('\n')

    super(message)
    this.errors = errors
  }
}

function createValidator<T>(id: string) {
  return function validate(data: unknown): asserts data is T {
    const schema = schemaMeta[id]

    if (!schema) {
      throw new Error(`No schema exists with ID "${id}"`)
    }

    const validate = schema.getValidate()

    if (!validate(data) && validate.errors) {
      throw new ValidationError(validate.errors, schema)
    }
  }
}
