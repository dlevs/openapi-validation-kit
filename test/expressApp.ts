import express, { ErrorRequestHandler } from 'express'
import { OpenAPIKitValidationError } from './out'
import { wrapRoute } from './out/express'

export const app = express()

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

// TODO: Test the types of `req.query`, `req.params`, `req.headers`, `req.body`.

const errorRequestHandler: ErrorRequestHandler = (err, req, res, next) => {
  if (err instanceof OpenAPIKitValidationError) {
    res.send({ error: err.message })
    return
  }

  next()
}

app.use(errorRequestHandler)
