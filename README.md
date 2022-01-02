> ⚠️ **Work in progress**
>
> This README describes the desired API. It's under development.

TODO: High-level summary here

Work-in-progress way to compile (TODO: Remove):
`node dist/src/index.js compile -w ./examples/petstore.json`

## TODO

- [ ] Document why types are peerDependency
- [ ] Improve validation error messages
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

#### Basic usage - Express

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
      res.send({
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

<!-- TODO: Tidy heading structure of this doc -->

#### Basic usage - Direct

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
