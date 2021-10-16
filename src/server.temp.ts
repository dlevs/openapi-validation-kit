import express from 'express'
import { validate } from './lib/runtime'

const app = express()
// const validate = Validate({ validateResponses: true })

app.post(
  '/pets',
  validate.addPet(async (req, res) => {
    res.status(200).send({ id: 1, name: req.body.name })
  })
)

app.get(
  '/pets/:petId',
  validate['find pet by id'](async (req, res) => {
    if (req.params.id !== 1) {
      return res.status(404).send({ code: 1029, message: 'Pet not found!' })
    }

    return res
      .status(200)
      .send({ id: req.params.id, name: 'Fluffy', tag: 'good-boy' })

    // // Response validated (200)
    // return {
    //   status: '200',
    //   body: { id: req.params.petId, name: 'foo', photoUrls: [] },
    // }
  })
)

app.listen(3000)
