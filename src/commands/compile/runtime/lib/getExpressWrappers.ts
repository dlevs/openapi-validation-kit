import type { Request, Response, NextFunction, Handler } from 'express'
import { RequestType, ResponseBody } from './types.js'
import { getValidators, ValidationError } from './getValidators.js'

export const getExpressWrappers = <
  Validators extends ReturnType<typeof getValidators>,
  Types extends Record<string, RequestType>
>(
  validators: Validators
) => {
  return Object.fromEntries(
    // TODO: Object.key
    Object.entries(validators).map(([operationId]) => {
      return [operationId, createHandlerWrapper(operationId)]
    })
  )

  function createHandlerWrapper<ID extends keyof Types>(operationId: ID) {
    return function wrapHandlerWithValidation(
      handler: HandlerWithValidation<Types[ID]>
    ) {
      // TODO: HOC - read function name here for stacktrace
      return async function handlerWithValidation(
        req: Request,
        res: Response,
        next: NextFunction
      ) {
        try {
          // @ts-ignore
          validators[operationId].params(req.params)
          // @ts-ignore
          validators[operationId].query(req.query)
          // @ts-ignore
          validators[operationId].headers(req.headers)
          // @ts-ignore
          validators[operationId].requestBody(req.body)
        } catch (err) {
          if (err instanceof ValidationError) {
            res.status(422)
            return next(err)
          }
        }

        function send(status: number, body: unknown) {
          try {
            // @ts-ignore
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
}

export type WrapHandlerWithValidation<T extends RequestType> = (
  handler: HandlerWithValidation<T>
) => Handler

type HandlerWithValidation<T extends RequestType> = (
  req: ValidatedRequest<T>,
  res: ValidatedResponse<T>,
  next: NextFunction
) => void

type ValidatedRequest<T extends RequestType> = Request<
  T['params'],
  T['responseBody'][keyof T['responseBody']],
  T['requestBody'],
  T['query']
>

type ValidatedResponse<T extends RequestType> = Omit<
  Response,
  'status' | 'send' | 'json'
> & {
  status<Status extends number>(
    code: Status
  ): ResponseSend<ResponseBody<T, Status>>
} & ResponseSend<ResponseBody<T, 200>>

interface ResponseSend<T> {
  send(data: T): void
  json(data: T): void
}
