// TODO: Rename this file + move. Have:
// - 1 test file for express (supertest)
// - 1 test file for plain validator functions
// - 1 test file for outputted types

import express, { NextFunction, Request, Response } from 'express'
import { wrapRoute } from '../lib/runtime/express'
import { ValidationError } from '../lib/runtime/validators'

export const app = express()

// app.use(function loggingMiddleware(
//   req: Request,
//   res: Response,
//   next: NextFunction
// ): void {
//   console.log(`Request: ${req.path}`, req.params)

//   next()
// })

app.get(
  '/pets/:id',
  wrapRoute['find pet by id'](async (req, res) => {
    switch (req.params.id) {
      case 1:
        return res.send({
          id: 2,
          name: 'Buddy',
        })
      case 2:
        return res.send({
          id: 2,
          name: 'Buddy',
          whyDoesTSNotMindThisProp: 'dog', // TODO: check this
        })
      case 10:
        // @ts-expect-error
        return res.send({})
      case 11:
        // @ts-expect-error
        return res.send({ id: 'Bleh', name: 'La' })
      case 12:
        // @ts-expect-error
        return res.send({ name: 'Floooof' })
      case 13:
        // @ts-expect-error
        return res.send({ id: 13, name: 'Greg', tag: 9 })

      case 20:
        // TODO: Use a better example schema to test this
        return res.status(400).send({
          code: 400,
          message: 'Pet not found',
          type: 'general',
        })
      default:
        return res.status(404).send({
          code: 404,
          message: 'Pet not found',
          type: 'general',
        })
    }
  })
)

app.use(function validationErrorMiddleware(
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (err instanceof ValidationError) {
    res.send({ error: err.message })
    return
  }

  next()
})
