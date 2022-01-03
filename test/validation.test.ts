import { validateAddPetRequestBody } from './out'

describe('Foo TODO', () => {
  test('it TODO', () => {
    // @ts-expect-error
    expect(() => validateAddPetRequestBody()).toThrow(
      'Request body must be object'
    )
    expect(() => validateAddPetRequestBody({})).toThrow(
      "Request body must have required property 'name'"
    )
    // TODO: Check the type coercion
    expect(() => validateAddPetRequestBody({ name: 11 })).not.toThrow()
    expect(() => validateAddPetRequestBody({ name: 'Foo' })).not.toThrow()
  })
})
