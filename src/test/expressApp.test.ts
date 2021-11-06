import request from 'supertest'
import { app } from './expressApp'

describe('Request validation', () => {
  it('Accepts a good path', async () => {
    await request(app).get('/pets/1').expect(200, {
      id: 2,
      name: 'Buddy',
    })
  })

  it('Rejects parameters that are the wrong type', async () => {
    await request(app).get('/pets/foo').expect(422, {
      error: "Request path parameter 'id' must be integer",
    })
  })
})

describe('Response validation', () => {
  // This is just documenting current behaviour - not necessarily desired behaviour.
  it('Extra properties are allowed, and not stripped', async () => {
    await request(app).get('/pets/2').expect(200, {
      id: 2,
      name: 'Buddy',
      whyDoesTSNotMindThisProp: 'dog',
    })
  })

  it('Rejects missing response properties', async () => {
    await request(app).get('/pets/10').expect(422, {
      error: "Response body must have required property 'name'",
    })
    await request(app).get('/pets/12').expect(422, {
      error: "Response body must have required property 'id'",
    })
  })

  it('Rejects properties that are the wrong type', async () => {
    await request(app).get('/pets/11').expect(422, {
      error: "Response body property 'id' must be integer",
    })
  })

  it('Coerces property types where it can', async () => {
    await request(app).get('/pets/13').expect(200, {
      id: 13,
      name: 'Greg',
      tag: '9',
    })
  })
})
