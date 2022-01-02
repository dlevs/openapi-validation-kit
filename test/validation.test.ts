// TODO: Improve this filepath
import { validateAddPetRequestBody } from 'openapi-validation-kit-test-output/data/validators'

// TODO: swc doesn't type check (I think), so make sure we're including test files in normal tsc compiled output

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
