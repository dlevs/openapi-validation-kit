import express from 'express'
import { validate } from './lib/runtime'

const app = express()
// const validate = Validate({ validateResponses: true })

app.get(
  '/pets/:id',
  validate['find pet by id']((req, res) => {
    if (req.params.id !== 1) {
      return res
        .status(404)
        .send({ code: 1029, message: 'Pet not found!', type: 'general' })
    }

    return res
      .status(200)
      .send({ id: req.params.id, name: 'Fluffy', tag: 'good-boy' })
  })
)

app.listen(3000)
