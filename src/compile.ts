import fs from 'fs-extra'
import path from 'path'
import { OpenAPIV3 } from 'openapi-types'
import { compile } from 'json-schema-to-typescript'
import prettier from 'prettier'
import { createSchemaObj, assertNotRef } from './lib/schemaUtils'
import { isNotArray, isNotNullish, isNotString } from './lib/typeUtils'

function rootPath(...pathComponents: string[]) {
  return path.join(__dirname, '../', ...pathComponents)
}

async function main() {
  // TODO: Validate spec?
  // const spec: OpenAPIV3 = await SwaggerParser.dereference(
  //   await fs.readJSON(path.join(__dirname, '../examples/petstore.json'))
  // )

  const spec: OpenAPIV3.Document = await fs.readJSON(
    path.join(__dirname, '../examples/petstore.json')
  )

  //
  const schemaEntries = Object.values(spec.paths!)
    .filter(isNotNullish)
    // TODO: Don't flatmap here! There may be "parameters" at the path level that apply to all routes below
    .flatMap((path) => Object.values(path))
    .filter(isNotString) // TODO: What _is_ a valid string value here?
    .filter(isNotArray) // TODO: What _is_ a valid array value here?
    .map((method) => {
      // TODO: Tidy
      const responseBodies = {
        oneOf: Object.entries(method.responses)
          .map(([status, response]) => {
            if (!response) return null

            assertNotRef(response)

            let { content, description } = response

            const schema = content?.['application/json']?.schema

            return createSchemaObj({
              status:
                status === 'default'
                  ? { type: 'number', description }
                  : { enum: [Number(status)], description },
              body: schema ?? ({ tsType: 'unknown' } as any), // TODO: Type this properly
            })
          })
          .filter(Boolean),
      }

      // TODO: Check for method.operationId

      // TODO: Check. Document
      if (responseBodies.oneOf.length === 0) {
        throw new Error(
          `No responses found for operation ${method.operationId}`
        )
      }

      const schemas = {
        path: createSchemaObj({}),
        query: createSchemaObj({}, { additionalProperties: true }),
        header: createSchemaObj({}, { additionalProperties: true }),
      }
      const { requestBody } = method
      let body: null | OpenAPIV3.SchemaObject | OpenAPIV3.ReferenceObject = null

      if (requestBody) {
        assertNotRef(requestBody)
        body = requestBody?.content?.['application/json']?.schema ?? null
      }

      method.parameters?.forEach((param) => {
        if ('$ref' in param) {
          return null //TODO
        }

        // TODO: pick valid props instead of omitting invalid ones
        const {
          in: paramIn,
          name,
          required,
          description,
          allowEmptyValue, // TODO: Validate this?
          schema,
        } = param

        // TODO: Var names
        const schemaToPushTo = schemas[paramIn as keyof typeof schemas] ?? null
        if (schemaToPushTo) {
          schemaToPushTo.properties[name] = {
            ...schema,
            nullable: !required, // TODO: Check this
          }
          if (required) {
            schemaToPushTo.required?.push(name)
          }
        }
      })

      return [
        method.operationId,
        createSchemaObj(
          Object.fromEntries([
            ['Params', schemas.path],
            ['Query', schemas.query],
            ['Headers', schemas.header],
            [
              'RequestBody',
              body
                ? body
                : // TODO: Is there a better way to do this? Or just ignore the body?
                  {
                    description: 'No request body',
                    tsType: 'never',
                  },
            ],
            ['ResponseBody', responseBodies],
          ]),
          { description: method.description }
        ),
      ]
    })

  const schemaObject = Object.fromEntries(schemaEntries)

  const typesCode = await compile(
    {
      // Replace components with definitions. This effects type generation.
      // See the comments below for reasoning.
      // The JSON stringify / parse is grim... but it works.
      ...JSON.parse(
        JSON.stringify(createSchemaObj(schemaObject), (prop, value) => {
          if (prop === '$ref' && typeof value === 'string') {
            return value.replace('#/components/schemas/', '#/definitions')
          }
        })
      ),
      // Things in "definitions" get referenced instead of inlined to types
      // by json-schema-to-typescript. These are what people will want to
      // reference in their app code, so this is what we expose.
      definitions: spec.components?.schemas,
      // "components" is not significant to json-schema-to-typescript. Things
      // referenced here will just get inlined into the outputted types.
      components: spec.components,
    } as any,
    'Requests',
    {
      format: false,
      unreachableDefinitions: true,
    }
  )

  // TODO: Prettier really necessary?
  const file = prettier.format(typesCode, {
    semi: false,
    singleQuote: true,
    parser: 'typescript',
  })

  await fs.ensureDir(rootPath('./dist'))
  await Promise.all([
    fs.writeFile(rootPath('./dist/Requests.d.ts'), file),
    fs.writeFile(
      rootPath('./dist/schemas.json'),
      JSON.stringify(schemaObject, null, `\t`)
    ),
  ])
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
