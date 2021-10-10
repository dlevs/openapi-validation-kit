import { Application, Handler, NextFunction, Request, Response } from 'express'

const app: Application = null as any

namespace GetUser {
  export interface Params {
    id: string
  }

  export interface Query {
    full: boolean
  }

  export type RequestBody = never

  export interface ResponseBody {
    200: {
      id: string
      name: string
    }
    404: {
      code: 'ERR_USER_NOT_FOUND'
    }
  }
}

interface ResponseSend<T> {
  send(data: T): void
  json(data: T): void
}

interface GetUserHandler {
  (
    req: Request<
      GetUser.Params,
      GetUser.ResponseBody[200 | 404],
      GetUser.RequestBody,
      GetUser.Query
    >,
    // TODO: Make generic
    res: Omit<
      Response<GetUser.ResponseBody[200]>,
      'status' | 'send' | 'json'
    > & {
      status(code: 200): ResponseSend<GetUser.ResponseBody[200]>
      status(code: 404): ResponseSend<GetUser.ResponseBody[404]>
    } & ResponseSend<GetUser.ResponseBody[200]>,
    next: NextFunction
  ): Promise<
    | { status: 200; body: GetUser.ResponseBody[200] }
    | { status: 404; body: GetUser.ResponseBody[404] }
  >
}

const validate = {
  getUser: null as any as (handler: GetUserHandler) => Handler,
}

app.get(
  '/foo',
  validate.getUser(async (req, res) => {
    res.send({ id: 'd', name: 'ff' })
    res.status(200).send({ id: 'd', name: 'ff' })
    res.status(404).send({ code: 'ERR_USER_NOT_FOUND' })

    // // Response validated (200)
    return {
      status: 200,
      body: { id: 'd', name: 'ff' },
    }
  })
)
