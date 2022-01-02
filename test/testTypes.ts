import type { Pet, NewPet, Error } from 'openapi-validation-kit-test-output'

expectType<Pet>({ name: 'Foofoo', id: 3, tags: ['Cool'] })
expectType<NewPet>({ name: 'Ruffles' })
expectType<Error>({ code: 403, message: 'Oh no!', type: 'general' })

// @ts-expect-error: No `id` property
expectType<Pet>({ name: 'Foofoo', tags: ['Cool'] })

// TypeScript throws a compile-time error if our types are wrong.
function expectType<T>(value: T) {
  return value
}
