// TODO: Rename this file + move. Have:
// - 1 test file for express (supertest)
// - 1 test file for plain validator functions
// - 1 test file for outputted types

import { validators } from './lib/runtime/validators'

const foo: unknown = {}

// TODO: Fix error:
// "Assertions require every name in the call target to be declared with an explicit type annotation.ts(2775)"
// We may need to actually hardcode the output (compile it...)
validators.addPet.requestBody(foo)
foo

validators.addPet.responseBody(foo, 200)
foo

// import express, { response } from 'express'
// import { Pet } from '../dist/Requests'
// import { validate } from './lib/runtime/express'

// const app = express()
// // const validate = Validate({ validateResponses: true })

// app.get(
//   '/pets/:id',
//   validate.addPet(async (req, res) => {
//     try {
//       return res.send(await getPet())
//     } catch (err) {
//       return res.status(404).send({
//         code: 404,
//         message: 'Pet not found',
//         type: 'bad',
//       })
//     }
//   })
// )

// const getPet = async (): Promise<Pet> => {
//   return {
//     id: 3,
//     name: 'Foo',
//   }
// }

// app.listen(3000)
