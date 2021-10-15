import Ajv from 'ajv'
import type { Request, Response, NextFunction } from 'express'
// TODO: Naming
import schemas from '../dist/schemas.json'
import type Requests from '../dist/Requests'

// TODO: Options
const ajv = new Ajv({ coerceTypes: 'array', useDefaults: 'empty' })

interface ResponseSend<T> {
  send(data: T): void
  json(data: T): void
}

type OperationId = keyof Requests

type ResponseStatus<
  ID extends OperationId,
  Code extends number
> = Code extends keyof Requests[ID]['ResponseBodies']
  ? Requests[ID]['ResponseBodies'][Code]
  : never

type ValidatedRequest<ID extends OperationId> = Request<
  Requests[ID]['Params'],
  Requests[ID]['ResponseBodies'][keyof Requests[ID]['ResponseBodies']],
  Requests[ID]['RequestBody'],
  Requests[ID]['Query']
>

type ValidatedResponse<ID extends OperationId> = Omit<
  Response,
  'status' | 'send' | 'json'
> & {
  status<Status extends keyof Requests[ID]['ResponseBodies']>(
    code: Status
  ): ResponseSend<Requests[ID]['ResponseBodies'][Status]>
} & ResponseSend<ResponseStatus<ID, 200>>

type ValidatedResponseReturn<ID extends OperationId> = UnionizeResponses<
  Requests[ID]['ResponseBodies']
>

type UnionizeResponses<ResponseDictionary extends object> = {
  [Status in keyof ResponseDictionary]: {
    status: Status
    body: ResponseDictionary[Status]
  }
}[keyof ResponseDictionary]

function getValidators<ID extends OperationId>(operationId: ID) {
  type Req = Requests[ID]
  const { Params, Query, Headers, RequestBody, ResponseBodies } =
    schemas[operationId].properties

  return {
    params: ajv.compile<Req['Params']>(Params),
    query: ajv.compile<Req['Query']>(Query),
    headers: ajv.compile<Req['Headers']>(Headers),
    requestBody: ajv.compile<Req['Query']>(RequestBody),
  }
}

function createValidationHandlerWrapper<ID extends OperationId>(
  operationId: ID
) {
  let validate: ReturnType<typeof getValidators>

  return function wrapHandlerWithValidation(
    handler: (
      req: ValidatedRequest<ID>,
      res: ValidatedResponse<ID>,
      next: NextFunction
    ) => Promise<ValidatedResponseReturn<ID>>
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
      if (!validate.params(req.params)) {
        return next(
          new Error(
            `Validation error: Request path params ${validate.params.errors[0].message}`
          )
        )
      }

      if (!validate.headers(req.headers)) {
        return next(
          new Error(
            `Validation error: Headers ${validate.headers.errors[0].message}`
          )
        )
      }

      if (!validate.query(req.query)) {
        return next(
          new Error(
            `Validation error: Request query ${validate.query.errors[0].message}`
          )
        )
      }

      if (!validate.requestBody(req.body)) {
        return next(
          new Error(
            `Validation error: Request body ${validate.requestBody.errors[0].message}`
          )
        )
      }

      // TODO: Class for this
      const modifiedRes = {
        ...res,
        status(status) {
          console.log(status)
          return {
            ...modifiedRes,
            send(body) {
              console.log(body)
              // TODO: Check this response exists
              if (!validate.responseBodies[status](body)) {
                return next(
                  new Error(
                    `Validation error: Response body ${validate.responseBodies[status].errors[0].message}`
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

export const validate = {
  uploadFile: createValidationHandlerWrapper('uploadFile'),
  addPet: createValidationHandlerWrapper('addPet'),
  updatePet: createValidationHandlerWrapper('updatePet'),
  findPetsByStatus: createValidationHandlerWrapper('findPetsByStatus'),
  findPetsByTags: createValidationHandlerWrapper('findPetsByTags'),
  getPetById: createValidationHandlerWrapper('getPetById'),
  updatePetWithForm: createValidationHandlerWrapper('updatePetWithForm'),
  deletePet: createValidationHandlerWrapper('deletePet'),
  getInventory: createValidationHandlerWrapper('getInventory'),
  placeOrder: createValidationHandlerWrapper('placeOrder'),
  getOrderById: createValidationHandlerWrapper('getOrderById'),
  deleteOrder: createValidationHandlerWrapper('deleteOrder'),
  createUsersWithListInput: createValidationHandlerWrapper(
    'createUsersWithListInput'
  ),
  getUserByName: createValidationHandlerWrapper('getUserByName'),
  updateUser: createValidationHandlerWrapper('updateUser'),
  deleteUser: createValidationHandlerWrapper('deleteUser'),
  loginUser: createValidationHandlerWrapper('loginUser'),
  logoutUser: createValidationHandlerWrapper('logoutUser'),
  createUsersWithArrayInput: createValidationHandlerWrapper(
    'createUsersWithArrayInput'
  ),
  createUser: createValidationHandlerWrapper('createUser'),
}
