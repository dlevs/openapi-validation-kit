// TODO: Rename this file + move. Have:
// - 1 test file for express (supertest)
// - 1 test file for plain validator functions
// - 1 test file for outputted types

import { validateAddPetRequestBody } from '../../dist/validators'

const foo: unknown = {}

// TODO: Fix error:
// "Assertions require every name in the call target to be declared with an explicit type annotation.ts(2775)"
// We may need to actually hardcode the output (compile it...)
validateAddPetRequestBody(foo)
foo

import express from 'express'
import { Pet } from '../../dist/Requests'
import { wrapRoute } from '../lib/runtime/express'

const app = express()
// const validate = Validate({ validateResponses: true })

app.get(
  '/pets/:id',
  wrapRoute.addPet(async (req, res) => {
    try {
      return res.send(await getPet())
    } catch (err) {
      return res.status(404).send({
        code: 404,
        message: 'Pet not found',
        type: 'bad',
      })
    }
  })
)

const getPet = async (): Promise<Pet> => {
  return {
    id: 3,
    name: 'Foo',
  }
}

// app.listen(3000)
