import './lib/runtime/validators'

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
