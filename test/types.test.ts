import { Pet, NewPet, Error } from 'openapi-validation-kit-test-output'

// The intention of this file is to test types. Jest isn't really involved.
function validateType<T>(value: T) {
  return value
}

describe('Outputted types', () => {
  test('Match expected types', () => {
    expect(
      validateType<Pet>({ name: 'Foofoo', id: 98, tags: ['Cool'] })
    ).toBeDefined()
    expect(validateType<NewPet>({ name: 'Ruffles' })).toBeDefined()
    expect(
      validateType<Error>({ code: 403, message: 'Oh no!', type: 'general' })
    ).toBeDefined()

    // @ts-expect-error
    expect(validateType<Pet>({ name: 11 })).toBeDefined()
  })
})
