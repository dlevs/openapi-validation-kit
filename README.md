> ⚠️ **Work in progress**
>
> This README describes the desired API. It's under development.

TODO: High-level summary here

## TODO

- [ ] Decide on an approach - `runtimeExperiments.ts` vs `runtime.ts`
- [ ] Expose generic functions for validation
- [ ] Expose express functions under `/express` path
- [ ] Improve validation error messages
- [ ] Build CLI
  - [ ] Accept args
  - [ ] Have it generate a tidy bundle with a package.json pointing to entry points
  - [ ] Add help text
- [ ] Compile all TS down to JS / .d.ts files
- [ ] Add handlers for direct return (objects with "status" properties, and those without (200))
- [ ] Add tests
  - [ ] CLI
  - [ ] supertest (api)
  - [ ] Types test
  - [ ] validator tests
- [ ] Tidy + address TODOs
- [ ] Finish README docs
- [ ] Publish to npm

## Installation

## Usage

### CLI

```sh
oapivk -o dist ./my-schema.json
```

This generates `.js` and `.d.ts` files that can be imported to perform validation, types, and wrapper functions for various server frameworks which perform the validation and offer powerful type inference.

```yaml
paths:
  '/pets/{id}':
    get:
      operationId: getPet
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: integer
      responses:
        '200':
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Pet'
        '404':
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorNotFound'
        '4XX':
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorBadRequest'
        default:
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Error'
components:
  schemas:
    Pet:
      type: object
      required:
        - id
        - name
      properties:
        id:
          type: integer
          format: int64
        name:
          type: string
    ErrorNotFound:
      type: object
      required:
        - message
      properties:
        message:
          type: string
    ErrorBadRequest:
      type: object
      required:
        - beep
      properties:
        beep:
          enum:
            - boop
    Error:
      type: object
      properties: # omitted
```

#### Basic usage

```ts
import express from 'express'
import validate from './dist/express'

const app = express()
const teapot = 42

app.get(
  '/pets/:id',
  validate.getPet((req, res) => {
    // `req.params.id` is parsed as a number and validated.
    // TypeScript knows it is a number.
    if (req.params.id === 1) {
      res.status(200).send({
        // TypeScript provides correct autocomplete and checking of
        // the `200` response object.
        id: 1,
        name: 'Fluffy',
      })
    } else if (req.params.id === teapot) {
      res.status(418).send({
        // Type `ErrorBadRequest` is enforced based on the
        // "4XX" response in the JSON schema.
        beep: 'boop',
      })
    } else {
      res.status(404).send({
        // Type `ErrorNotFound` is enforced based on the
        // "404" response in the JSON schema.
        // This type "wins" over the more generic "4XX" response,
        // which itself wins over "default" responses. (400 > 4XX > default)
        message: 'Pet not found',
      })
    }
  })
)
```

#### Returns

```ts
app.get(
  '/pets/:id',
  validate.getPet(async (req, res) => {
    if (req.params.id === 1) {
      return {
        status: 200,
        body: {
          id: req.params.id,
          name: 'Fluffy'
        }
      }
    }

    return {
      status: 404,
      body: {
        message: 'Pet not found',
      }
  })
)
```

#### The default status - 200

```ts
const pet = {
  id: 1,
  name: 'Fluffy',
}

// The following are all equivalent:
// 1. Return with explicit `200` status
return {
  status: 200,
  body: pet,
}
// 2. Return without a status
return pet
// 3. Chaining `.send()` from `.status(200)`
res.status(200).send(pet)
// 4. Using `.send()` without setting a status
res.send(pet)
```

With the defaults, it's easy to write terse, idiomatic JavaScript:

```ts
app.get(
  '/pets/:id',
  validate.getPet((req) => {
    return getPetFromDatabase(req.params.id)
  })
)
```

This is the most basic usage. It looks simple - let's break down what it's doing:

1. The request parameters are validated. If the `id` parameter provided in the URL path is not a valid number, an error is returned with status code `422`.
2. `req.params.id` is coerced from a `string` to a `number`.
3. TypeScript will display an error if the return value of `getPetFromDatabase()` does not resolve to the type generated for the `Pet` schema.
4. The response body is validated against the `200` response schema provided, and a `422` error is returned. TODO: What does fastify do here?
5. The returned value is sent under the hood via `res.send()`.
6. If the handler throws an error (or returns a promise that rejects) then that is automatically passed to express' `next()` function.

The response body will be validated (if that feature is not disabled), and TypeScript will

We'll assume that middleware handles the errors and focus on just getting the data for
the user.

```ts
import { validators } from './dist'

let pet: unknown

// TODO: This is useful, but maybe also expose a validator that allows you to just pass a status as a function argument, so "402" would work for "4XX" schema
let validator = validators.getPet.responseBody['200']
if (validator(pet)) {
  // `pet` is valid and typed correctly
  console.log(`Hello ${pet.name}`)
} else {
  // validator is an ajv validator.
  // There are methods to format the error message for the user.
  console.error('pet is not valid', validator.errors)
}
```

### Types

```ts
import type { Pet, ErrorBadRequest, Error } from './dist'

const myPet: Pet = {
  id: 1,
  name: 'Fluffy',
}
```

## Motivation

This project was inspired by [fastify](https://www.fastify.io/)'s built in schema validation. I wanted that in express, and I wanted TypeScript to be aware of the types too. There are projects that bring the validation functionality to express, like [express-openapi-validator](https://www.npmjs.com/package/express-openapi-validator); these are great, but they don't provide the tight TypeScript integration that is possible when you have a separate compile step.

There might be something out there that does the job, but I've not yet found it.

This project is currently nails my use case, but does not try to be complete. If you need something battle-tested and production-ready, this is not it (yet).

## Drawbacks / deliberate API design decisions

- **Compilation** - Nobody wants to run a command every time they edit their schema to use the types - it's cumbersome. But it's necessary to provide the correct TypeScript types. The `--watch` flag aims to reduce this friction.
- **Only supports OpenAPI version 3.0** - There are [tools that convert from other formats](https://www.npmjs.com/package/api-spec-converter), use those on your document first.
- **No remapping** - It's common for tools like [Amazon's API Gateway](https://aws.amazon.com/api-gateway/) to enable mapping of the publicly-accessible API to the internal services that power them, where the path can be rewritten, and parameters from the path mapped to query parameters, and vice-versa. This package does not understand this. To make use of such features, you'd need to preprocess the OpenAPI document so that the desired output of the mapping (which for AWS is in `x-amazon-apigateway-integration` objects) is expressed as a valid OpenAPI document that represents the parameters the internal services expect.

  Note, such gateways often have validation built in, if you choose to enable it. They tend to lack support for validating response bodies, or support for newer "format" values, and the "pattern" property (or, I've been holding it wrong - also likely!).

- **Limited magic** - The dream might be an interface like below:

  ```ts
  app.get('/pets/:id', (req, res) => {
    // `req` and `res` are typed correctly, and validated by middleware
    // purely based off the first argument: '/pets/:id'.
  })
  ```

  This may be possible, but feels a bit _too_ magic, and breaks nested routing capabilities. The wrapper function approach used by this library feels like the right balance of magic and explicitness to lead to good DX, with hopefully minimal confusion.

## Dependencies

This project just hacks together things from other open source projects. It would not be possible without:

- [ajv](https://www.npmjs.com/package/ajv) - JSON schema validator
- [json-schema-to-typescript](https://www.npmjs.com/package/json-schema-to-typescript) - TypeScript types generator
- [openapi-types](https://www.npmjs.com/package/openapi-types) - Types for JSON schema
- [prettier](https://www.npmjs.com/package/prettier) - Code formatting

And others. Cheers. 😉
