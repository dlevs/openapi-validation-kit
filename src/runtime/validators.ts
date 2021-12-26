// @ts-nocheck TODO: TURN THIS OFF

import Ajv, { AnySchema, ErrorObject } from 'ajv'
import addFormats from 'ajv-formats'
// TODO: Naming
import rawSchemas from '../../../dist/schemas.json'
import { Requests } from '../../dist/Requests.js'
import { OperationId, ResponseBody } from './types.js'
import { AnyValidateFunction } from 'ajv/dist/core.js'

// TODO: Options
const ajv = new Ajv({ coerceTypes: 'array', useDefaults: 'empty' })
addFormats(ajv)

interface SchemaMeta {
  subjectSpecific: string
  subjectEntire: string
  getValidate(): AnyValidateFunction
}

const schemaMeta: Record<string, SchemaMeta> = {}

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
] of Object.entries(rawSchemas)) {
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

type ValidateFn<T> = (data: any) => asserts data is T

export const validators = Object.fromEntries(
  // TODO: Object.keys
  Object.entries(rawSchemas).map(([operationId]) => {
    // TODO: It's all a bit convoluted - why loop through above, and here?
    return [
      operationId,
      {
        params: createValidator(`${operationId}:params`),
        query: createValidator(`${operationId}:query`),
        headers: createValidator(`${operationId}:headers`),
        requestBody: createValidator(`${operationId}:requestBody`),
        responseBody: (data: unknown, status: number) => {
          const responses = rawSchemas[operationId as OperationId]
            .responseBody as { [status: string]: AnySchema }
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
) as Readonly<{
  [ID in OperationId]: Readonly<{
    params: (data: any) => asserts data is Requests[ID]['params']
    query: ValidateFn<Requests[ID]['query']>
    headers: ValidateFn<Requests[ID]['headers']>
    requestBody: ValidateFn<Requests[ID]['requestBody']>
    responseBody: <Status extends number>(
      data: unknown,
      status: Status
    ) => asserts data is ResponseBody<ID, Status>
  }>
}>
