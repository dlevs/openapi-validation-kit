import type { Request, Response, NextFunction, Handler } from 'express'
import { Requests } from './data/Requests.js'
import { OperationId, ResponseBody } from './types.js'
import { ValidationError, validators } from './validatorsBase.js'

export const wrapRoute = Object.fromEntries(
  // TODO: Object.key
  Object.entries(validators).map(([operationId]) => {
    return [operationId, createHandlerWrapper(operationId as OperationId)]
  })
) as any as {
  [ID in OperationId]: WrapHandlerWithValidation<ID>
}

function createHandlerWrapper<ID extends OperationId>(operationId: ID) {
  return function wrapHandlerWithValidation(
    handler: HandlerWithValidation<ID>
  ) {
    // TODO: HOC - read function name here for stacktrace
    return async function handlerWithValidation(
      req: Request,
      res: Response,
      next: NextFunction
    ) {
      try {
        validators[operationId].params(req.params)
        validators[operationId].query(req.query)
        validators[operationId].headers(req.headers)
        validators[operationId].requestBody(req.body)
      } catch (err) {
        if (err instanceof ValidationError) {
          res.status(422)
          return next(err)
        }
      }

      function send(status: number, body: unknown) {
        try {
          validators[operationId].responseBody(body, status)
        } catch (err) {
          if (err instanceof ValidationError) {
            res.status(422)
            return next(err)
          }
        }

        res.status(status).send(body)
        return modifiedRes
      }

      const modifiedRes = {
        ...res,
        send(body: unknown) {
          return send(200, body)
        },
        status<Status extends number>(status: Status) {
          // TODO: It's a bug that we don't set status if `send()` never called. Fix

          return {
            ...modifiedRes,
            send(body: unknown) {
              return send(status, body)
            },
          }
        },
      }

      return handler(
        req,
        // @ts-expect-error
        modifiedRes,
        next
      )
    }
  }
}

interface ResponseSend<T> {
  send(data: T): void
  json(data: T): void
}

type ValidatedRequest<ID extends OperationId> = Request<
  Requests[ID]['params'],
  Requests[ID]['responseBody'][keyof Requests[ID]['responseBody']],
  Requests[ID]['requestBody'],
  Requests[ID]['query']
>

type ValidatedResponse<ID extends OperationId> = Omit<
  Response,
  'status' | 'send' | 'json'
> & {
  status<Status extends number>(
    code: Status
  ): ResponseSend<ResponseBody<ID, Status>>
} & ResponseSend<ResponseBody<ID, 200>>

type WrapHandlerWithValidation<ID extends OperationId> = (
  handler: HandlerWithValidation<ID>
) => Handler

// TODO: Naming
type HandlerWithValidation<ID extends OperationId = OperationId> = (
  req: ValidatedRequest<ID>,
  res: ValidatedResponse<ID>,
  next: NextFunction
) => void
