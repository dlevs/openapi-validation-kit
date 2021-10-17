import Ajv, { ValidateFunction } from 'ajv'
import addFormats from 'ajv-formats'
import type { Request, Response, NextFunction, Handler } from 'express'
// TODO: Naming
import schemas from '../../dist/schemas.json'
import type {
  Requests,
  StatusCode1XX,
  StatusCode2XX,
  StatusCode3XX,
  StatusCode4XX,
  StatusCode5XX,
} from '../../dist/Requests'
// TODO: Options
const ajv = new Ajv({ coerceTypes: 'array', useDefaults: 'empty' })
addFormats(ajv)

interface ResponseSend<T> {
  send(data: T): void
  json(data: T): void
}

type OperationId = keyof Requests

type ValidatedRequest<ID extends OperationId> = Request<
  Requests[ID]['params'],
  Requests[ID]['responseBody'][keyof Requests[ID]['responseBody']],
  Requests[ID]['requestBody'],
  Requests[ID]['query']
>

type ResponseBodyBase<ID extends OperationId, Status> = Extract<
  Requests[ID]['responseBody'],
  { status: Status }
>['body']

type ResponseBody<ID extends OperationId, Status> = ResponseBodyBase<
  ID,
  Status
> extends never
  ? ResponseBodyBase<ID, ExpandStatus<Status>> extends never
    ? ResponseBodyBase<ID, 'default'>
    : ResponseBodyBase<ID, ExpandStatus<Status>>
  : ResponseBodyBase<ID, Status>

// TODO: Is there a better way to do this?
type ExpandStatus<Status> = Status extends StatusCode1XX
  ? StatusCode1XX
  : Status extends StatusCode2XX
  ? StatusCode2XX
  : Status extends StatusCode3XX
  ? StatusCode3XX
  : Status extends StatusCode4XX
  ? StatusCode4XX
  : Status extends StatusCode5XX
  ? StatusCode5XX
  : never

type ValidatedResponse<ID extends OperationId> = Omit<
  Response,
  'status' | 'send' | 'json'
> & {
  status<Status extends number>(
    code: Status
  ): ResponseSend<ResponseBody<ID, Status>>
} & ResponseSend<ResponseSend<ResponseBody<ID, 200>>>

type ValidatedResponseReturn<ID extends OperationId> = UnionizeResponses<
  Requests[ID]['responseBody']
>

type UnionizeResponses<ResponseDictionary extends object> = {
  [Status in keyof ResponseDictionary]: {
    status: Status
    body: ResponseDictionary[Status]
  }
}[keyof ResponseDictionary]

function getValidators<ID extends OperationId>(operationId: ID) {
  type Req = Requests[ID]
  const { params, query, headers, requestBody, responseBody } =
    schemas[operationId]

  return {
    params: ajv.compile<Req['params']>(params),
    query: ajv.compile<Req['query']>(query),
    headers: ajv.compile<Req['headers']>(headers),
    requestBody: ajv.compile<Req['requestBody']>(requestBody),
    responseBody: Object.fromEntries(
      Object.entries(responseBody).map(([status, schema]) => {
        return [status, ajv.compile(schema)] as const
      })
    ) as {
      [K in keyof typeof schemas[ID]['responseBody']]: ValidateFunction<
        ResponseBody<ID, K>
      >
    },
  }
}

type WrapHandlerWithValidation<ID extends OperationId> = (
  handler: HandlerWithValidation<ID>
) => Handler

// TODO: Naming
type HandlerWithValidation<ID extends OperationId> = (
  req: ValidatedRequest<ID>,
  res: ValidatedResponse<ID>,
  next: NextFunction
) => MaybePromise<ValidatedResponseReturn<ID> | void>

type MaybePromise<T> = Promise<T> | T

function createValidationHandlerWrapper<ID extends OperationId>(
  operationId: ID
) {
  // TODO: Optimise. No need to call this for EVERY operation on startup
  let validate = getValidators(operationId)

  return function wrapHandlerWithValidation(
    handler: HandlerWithValidation<ID>
  ) {
    // TODO: HOC - read function name here for stacktrace
    return function handlerWithValidation(
      req: Request,
      res: Response,
      next: NextFunction
    ) {
      // // type of validate extends `(data: any) => data is Foo`
      // const data: any = { foo: 1 }
      // TODO: Extract these. This, and the types, should be the main export. Framework-specific
      // middleware is secondary
      if (!validate.params(req.params)) {
        res.status(422)
        return next(
          new Error(
            ajv.errorsText(validate.params.errors, {
              dataVar: 'Request path params',
            })
          )
        )
      }

      if (!validate.headers(req.headers)) {
        res.status(422)
        return next(
          new Error(
            ajv.errorsText(validate.headers.errors, {
              dataVar: 'headers',
            })
          )
        )
      }

      if (!validate.query(req.query)) {
        res.status(422)
        return next(
          new Error(
            ajv.errorsText(validate.query.errors, {
              dataVar: 'Request query',
            })
          )
        )
      }

      if (!validate.requestBody(req.body)) {
        res.status(422)
        return next(
          new Error(
            ajv.errorsText(validate.requestBody.errors, {
              dataVar: 'Request body',
            })
          )
        )
      }

      // TODO: Class for this
      const modifiedRes = {
        ...res,
        status<Status extends number>(status: Status) {
          console.log(status)
          return {
            ...modifiedRes,
            send(body: unknown) {
              // TODO: Bad variable name soup
              const responses = validate.responseBody as Record<
                string,
                ValidateFunction<ResponseBody<ID, Status>>
              >
              const validator =
                responses[status] ||
                responses[`${String(status)[0]}XX`] ||
                responses.default

              if (!validator) {
                // TODO: Better error messages
                throw new Error(`No relevant response definition found`)
              }
              // TODO: Check this response exists

              if (!validator(body)) {
                res.status(422)
                return next(
                  new Error(
                    ajv.errorsText(validator.errors, {
                      dataVar: 'Response body',
                    })
                  )
                )
              }
              res.status(status).send(body)
              return modifiedRes
            },
          }
        },
      }

      return handler(req, modifiedRes, next)
    }
  }
}

// TODO: Prepend things to prevent collisions
interface ResponseSend<T> {
  send(data: T): void
  json(data: T): void
}

export const validate = Object.fromEntries(
  Object.entries(schemas).map(([key]) => {
    return [key, createValidationHandlerWrapper(key as keyof typeof schemas)]
  })
) as { [K in keyof typeof schemas]: WrapHandlerWithValidation<K> }
