import { Application } from 'express'
import { validate } from './lib'

const app: Application = null as any

app.get(
  '/foo',
  validate.getPetById(async (req, res) => {
    // TODO: Sort the fact that this must be a string status ("200" instead of 200). Maybe model the response types as an array to keep the number?
    res.status('200').send({ name: 'foo', photoUrls: [] })
    // res.send({ name: 'foo', photoUrls: [] })
    // res.send({ id: 'd', name: 'ff' })
    // res.status(200).send({ id: 'd', name: 'ff' })
    // res.status(404).send({ code: 'ERR_USER_NOT_FOUND' })
    // req.params
    // res.send({})
    // TODO: This currently errors. Retain missing status codes that currently get stripped
    return {
      status: '404',
    }

    // return {
    //   status: '200',
    //   body: { name: 'foo', photoUrls: [] },
    // }
    // // Response validated (200)
    // return {
    //   status: 200,
    //   body: {},
    // }
  })
)
