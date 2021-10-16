import Ajv from 'ajv'
import type { Request, Response, NextFunction, Handler } from 'express'
// TODO: Naming
import schemas from '../../dist/schemas.json'
import type { Requests } from '../../dist/Requests'
// TODO: Options
const ajv = new Ajv({ coerceTypes: 'array', useDefaults: 'empty' })

interface ResponseSend<T> {
  send(data: T): void
  json(data: T): void
}

type OperationId = keyof Requests

type ValidatedRequest<ID extends OperationId> = Request<
  Requests[ID]['Params'],
  Requests[ID]['ResponseBody'][keyof Requests[ID]['ResponseBody']],
  Requests[ID]['RequestBody'],
  Requests[ID]['Query']
>

type ValidatedResponse<ID extends OperationId> = Omit<
  Response,
  'status' | 'send' | 'json'
> & {
  status<Status extends keyof Requests[ID]['ResponseBody']>(
    code: Status
  ): ResponseSend<Requests[ID]['ResponseBody'][Status]>
} & ResponseSend<Extract<Requests[ID]['ResponseBody'], { status: 200 }>>

type ValidatedResponseReturn<ID extends OperationId> = UnionizeResponses<
  Requests[ID]['ResponseBody']
>

type UnionizeResponses<ResponseDictionary extends object> = {
  [Status in keyof ResponseDictionary]: {
    status: Status
    body: ResponseDictionary[Status]
  }
}[keyof ResponseDictionary]

function getValidators<ID extends OperationId>(operationId: ID) {
  type Req = Requests[ID]
  const { Params, Query, Headers, RequestBody, ResponseBody } =
    schemas[operationId].properties

  return {
    params: ajv.compile<Req['Params']>(Params),
    query: ajv.compile<Req['Query']>(Query),
    headers: ajv.compile<Req['Headers']>(Headers),
    requestBody: ajv.compile<Req['Query']>(RequestBody),
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
) => Promise<ValidatedResponseReturn<ID>>

function createValidationHandlerWrapper<ID extends OperationId>(
  operationId: ID
) {
  let validate: ReturnType<typeof getValidators>

  return function wrapHandlerWithValidation(
    handler: HandlerWithValidation<ID>
  ) {
    validate = validate || getValidators(operationId)

    // TODO: HOC - read function name here for stacktrace
    return function handlerWithValidation(
      req: Request,
      res: Response,
      next: NextFunction
    ) {
      // // type of validate extends `(data: any) => data is Foo`
      // const data: any = { foo: 1 }
      // TODO: Expert these. This, and the types, should be the main export. Framework-specific
      // middleware is secondary
      if (!validate.params(req.params)) {
        return next(
          new Error(
            ajv.errorsText(validate.params.errors, {
              dataVar: 'Request path params',
            })
          )
        )
      }

      if (!validate.headers(req.headers)) {
        return next(
          new Error(
            ajv.errorsText(validate.headers.errors, {
              dataVar: 'Headers',
            })
          )
        )
      }

      if (!validate.query(req.query)) {
        return next(
          new Error(
            ajv.errorsText(validate.query.errors, {
              dataVar: 'Request query',
            })
          )
        )
      }

      if (!validate.requestBody(req.body)) {
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
        status(status: number) {
          console.log(status)
          return {
            ...modifiedRes,
            send(body: unknown) {
              console.log(body)
              // TODO: Check this response exists
              if (!validate.responseBody[status](body)) {
                return next(
                  new Error(
                    `Validation error: Response body ${validate.responseBody[status].errors[0].message}`
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
  Object.entries(schemas).map(([key, value]) => {
    return [key, createValidationHandlerWrapper(value)]
  })
) as { [K in keyof typeof schemas]: WrapHandlerWithValidation<K> }
