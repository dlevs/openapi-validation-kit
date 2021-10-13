import express from 'express'
import { validate } from './lib.temp'

const app = express()
// const validate = Validate({ validateResponses: true })

app.get(
  '/pets',
  validate.findPetsByStatus(async (req, res) => {
    console.log(req.query.status)
    res.status('200').send([
      { id: 1, name: 'Foo', photoUrls: [] },
      { id: 2, name: 'Bar', photoUrls: [] },
    ])
  })
)

app.get(
  '/pets/:petId',
  validate.getPetById(async (req, res) => {
    // TODO: Sort the fact that this must be a string status ("200" instead of 200). Maybe model the response types as an array to keep the number?
    res.status('200').send({ id: req.params.petId, name: 'foo', photoUrls: [] })
    // res.send({ name: 'foo', photoUrls: [] })
    // res.send({ id: 'd', name: 'ff' })
    // res.status(200).send({ id: 'd', name: 'ff' })
    // res.status(404).send({ code: 'ERR_USER_NOT_FOUND' })
    // req.params
    // res.send({})
    // TODO: This currently errors. Retain missing status codes that currently get stripped
    // return {
    //   status: '404',
    //   body: {},
    // }

    // return {
    //   status: '200',
    //   body: { name: 'foo', photoUrls: [] },
    // }
    // // Response validated (200)
    // return {
    //   status: '200',
    //   body: { id: req.params.petId, name: 'foo', photoUrls: [] },
    // }
  })
)

app.listen(3000)
