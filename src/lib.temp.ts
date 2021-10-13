import Ajv, { JSONSchemaType } from 'ajv'
import type { Request, Response, NextFunction } from 'express'

// TODO: Options
const ajv = new Ajv({ coerceTypes: 'array', useDefaults: 'empty' })

const schemas = {
  uploadFile: {
    type: 'object',
    additionalProperties: false,
    required: ['Params', 'Query', 'Headers', 'RequestBody', 'ResponseBody'],
    properties: {
      Params: {
        type: 'object',
        additionalProperties: false,
        required: ['petId'],
        properties: {
          petId: {
            description: 'ID of pet to update',
            type: 'integer',
            nullable: false,
          },
        },
      },
      Query: {
        type: 'object',
        additionalProperties: true,
        required: [],
        properties: {},
      },
      Headers: {
        type: 'object',
        additionalProperties: true,
        required: [],
        properties: {},
      },
      RequestBody: {
        not: {
          oneOf: [
            {
              type: 'string',
            },
            {
              type: 'object',
              required: [],
              additionalProperties: true,
            },
          ],
        },
      },
      ResponseBody: {
        type: 'object',
        additionalProperties: false,
        required: ['200'],
        properties: {
          '200': {
            type: 'object',
            properties: {
              code: {
                type: 'integer',
                format: 'int32',
              },
              type: {
                type: 'string',
              },
              message: {
                type: 'string',
              },
            },
            required: [],
            additionalProperties: true,
          },
        },
      },
    },
  },
  addPet: {
    type: 'object',
    additionalProperties: false,
    required: ['Params', 'Query', 'Headers', 'RequestBody', 'ResponseBody'],
    properties: {
      Params: {
        type: 'object',
        additionalProperties: false,
        required: [],
        properties: {},
      },
      Query: {
        type: 'object',
        additionalProperties: true,
        required: [],
        properties: {},
      },
      Headers: {
        type: 'object',
        additionalProperties: true,
        required: [],
        properties: {},
      },
      RequestBody: {
        type: 'object',
        required: ['name', 'photoUrls'],
        properties: {
          id: {
            type: 'integer',
            format: 'int64',
          },
          category: {
            type: 'object',
            properties: {
              id: {
                type: 'integer',
                format: 'int64',
              },
              name: {
                type: 'string',
              },
            },
            xml: {
              name: 'Category',
            },
            required: [],
            additionalProperties: true,
          },
          name: {
            type: 'string',
            example: 'doggie',
          },
          photoUrls: {
            type: 'array',
            xml: {
              wrapped: true,
            },
            items: {
              type: 'string',
              xml: {
                name: 'photoUrl',
              },
            },
            minItems: 0,
          },
          tags: {
            type: 'array',
            xml: {
              wrapped: true,
            },
            items: {
              xml: {
                name: 'tag',
              },
              type: 'object',
              properties: {
                id: {
                  type: 'integer',
                  format: 'int64',
                },
                name: {
                  type: 'string',
                },
              },
              required: [],
              additionalProperties: true,
            },
            minItems: 0,
          },
          status: {
            type: 'string',
            description: 'pet status in the store',
            enum: ['available', 'pending', 'sold'],
          },
        },
        xml: {
          name: 'Pet',
        },
        additionalProperties: true,
      },
      ResponseBody: {
        type: 'object',
        additionalProperties: false,
        required: [],
        properties: {},
      },
    },
  },
  updatePet: {
    type: 'object',
    additionalProperties: false,
    required: ['Params', 'Query', 'Headers', 'RequestBody', 'ResponseBody'],
    properties: {
      Params: {
        type: 'object',
        additionalProperties: false,
        required: [],
        properties: {},
      },
      Query: {
        type: 'object',
        additionalProperties: true,
        required: [],
        properties: {},
      },
      Headers: {
        type: 'object',
        additionalProperties: true,
        required: [],
        properties: {},
      },
      RequestBody: {
        type: 'object',
        required: ['name', 'photoUrls'],
        properties: {
          id: {
            type: 'integer',
            format: 'int64',
          },
          category: {
            type: 'object',
            properties: {
              id: {
                type: 'integer',
                format: 'int64',
              },
              name: {
                type: 'string',
              },
            },
            xml: {
              name: 'Category',
            },
            required: [],
            additionalProperties: true,
          },
          name: {
            type: 'string',
            example: 'doggie',
          },
          photoUrls: {
            type: 'array',
            xml: {
              wrapped: true,
            },
            items: {
              type: 'string',
              xml: {
                name: 'photoUrl',
              },
            },
            minItems: 0,
          },
          tags: {
            type: 'array',
            xml: {
              wrapped: true,
            },
            items: {
              xml: {
                name: 'tag',
              },
              type: 'object',
              properties: {
                id: {
                  type: 'integer',
                  format: 'int64',
                },
                name: {
                  type: 'string',
                },
              },
              required: [],
              additionalProperties: true,
            },
            minItems: 0,
          },
          status: {
            type: 'string',
            description: 'pet status in the store',
            enum: ['available', 'pending', 'sold'],
          },
        },
        xml: {
          name: 'Pet',
        },
        additionalProperties: true,
      },
      ResponseBody: {
        type: 'object',
        additionalProperties: false,
        required: [],
        properties: {},
      },
    },
  },
  findPetsByStatus: {
    type: 'object',
    additionalProperties: false,
    required: ['Params', 'Query', 'Headers', 'RequestBody', 'ResponseBody'],
    properties: {
      Params: {
        type: 'object',
        additionalProperties: false,
        required: [],
        properties: {},
      },
      Query: {
        type: 'object',
        additionalProperties: true,
        // required: ['status'],
        properties: {
          status: {
            description: 'Status values that need to be considered for filter',
            type: 'array',
            items: {
              type: 'string',
              enum: ['available', 'pending', 'sold'],
            },
            default: ['available'],
            nullable: false,
            minItems: 0,
          },
        },
      },
      Headers: {
        type: 'object',
        additionalProperties: true,
        required: [],
        properties: {},
      },
      RequestBody: {
        not: {
          oneOf: [
            {
              type: 'string',
            },
            {
              type: 'object',
              required: [],
              additionalProperties: true,
            },
          ],
        },
      },
      ResponseBody: {
        type: 'object',
        additionalProperties: false,
        required: ['200'],
        properties: {
          '200': {
            type: 'array',
            items: {
              type: 'object',
              required: ['name', 'photoUrls'],
              properties: {
                id: {
                  type: 'integer',
                  format: 'int64',
                },
                category: {
                  type: 'object',
                  properties: {
                    id: {
                      type: 'integer',
                      format: 'int64',
                    },
                    name: {
                      type: 'string',
                    },
                  },
                  xml: {
                    name: 'Category',
                  },
                  required: [],
                  additionalProperties: true,
                },
                name: {
                  type: 'string',
                  example: 'doggie',
                },
                photoUrls: {
                  type: 'array',
                  xml: {
                    wrapped: true,
                  },
                  items: {
                    type: 'string',
                    xml: {
                      name: 'photoUrl',
                    },
                  },
                  minItems: 0,
                },
                tags: {
                  type: 'array',
                  xml: {
                    wrapped: true,
                  },
                  items: {
                    xml: {
                      name: 'tag',
                    },
                    type: 'object',
                    properties: {
                      id: {
                        type: 'integer',
                        format: 'int64',
                      },
                      name: {
                        type: 'string',
                      },
                    },
                    required: [],
                    additionalProperties: true,
                  },
                  minItems: 0,
                },
                status: {
                  type: 'string',
                  description: 'pet status in the store',
                  enum: ['available', 'pending', 'sold'],
                },
              },
              xml: {
                name: 'Pet',
              },
              additionalProperties: true,
            },
            minItems: 0,
          },
        },
      },
    },
  },
  findPetsByTags: {
    type: 'object',
    additionalProperties: false,
    required: ['Params', 'Query', 'Headers', 'RequestBody', 'ResponseBody'],
    properties: {
      Params: {
        type: 'object',
        additionalProperties: false,
        required: [],
        properties: {},
      },
      Query: {
        type: 'object',
        additionalProperties: true,
        required: ['tags'],
        properties: {
          tags: {
            description: 'Tags to filter by',
            type: 'array',
            items: {
              type: 'string',
            },
            nullable: false,
            minItems: 0,
          },
        },
      },
      Headers: {
        type: 'object',
        additionalProperties: true,
        required: [],
        properties: {},
      },
      RequestBody: {
        not: {
          oneOf: [
            {
              type: 'string',
            },
            {
              type: 'object',
              required: [],
              additionalProperties: true,
            },
          ],
        },
      },
      ResponseBody: {
        type: 'object',
        additionalProperties: false,
        required: ['200'],
        properties: {
          '200': {
            type: 'array',
            items: {
              type: 'object',
              required: ['name', 'photoUrls'],
              properties: {
                id: {
                  type: 'integer',
                  format: 'int64',
                },
                category: {
                  type: 'object',
                  properties: {
                    id: {
                      type: 'integer',
                      format: 'int64',
                    },
                    name: {
                      type: 'string',
                    },
                  },
                  xml: {
                    name: 'Category',
                  },
                  required: [],
                  additionalProperties: true,
                },
                name: {
                  type: 'string',
                  example: 'doggie',
                },
                photoUrls: {
                  type: 'array',
                  xml: {
                    wrapped: true,
                  },
                  items: {
                    type: 'string',
                    xml: {
                      name: 'photoUrl',
                    },
                  },
                  minItems: 0,
                },
                tags: {
                  type: 'array',
                  xml: {
                    wrapped: true,
                  },
                  items: {
                    xml: {
                      name: 'tag',
                    },
                    type: 'object',
                    properties: {
                      id: {
                        type: 'integer',
                        format: 'int64',
                      },
                      name: {
                        type: 'string',
                      },
                    },
                    required: [],
                    additionalProperties: true,
                  },
                  minItems: 0,
                },
                status: {
                  type: 'string',
                  description: 'pet status in the store',
                  enum: ['available', 'pending', 'sold'],
                },
              },
              xml: {
                name: 'Pet',
              },
              additionalProperties: true,
            },
            minItems: 0,
          },
        },
      },
    },
  },
  getPetById: {
    type: 'object',
    additionalProperties: false,
    required: ['Params', 'Query', 'Headers', 'RequestBody', 'ResponseBody'],
    properties: {
      Params: {
        type: 'object',
        additionalProperties: false,
        required: ['petId'],
        properties: {
          petId: {
            description: 'ID of pet to return',
            type: 'integer',
            nullable: false,
          },
        },
      },
      Query: {
        type: 'object',
        additionalProperties: true,
        required: [],
        properties: {},
      },
      Headers: {
        type: 'object',
        additionalProperties: true,
        required: [],
        properties: {},
      },
      RequestBody: {
        not: {
          oneOf: [
            {
              type: 'string',
            },
            {
              type: 'object',
              required: [],
              additionalProperties: true,
            },
          ],
        },
      },
      ResponseBody: {
        type: 'object',
        additionalProperties: false,
        required: ['200'],
        properties: {
          '200': {
            type: 'object',
            required: ['name', 'photoUrls'],
            properties: {
              id: {
                type: 'integer',
                format: 'int64',
              },
              category: {
                type: 'object',
                properties: {
                  id: {
                    type: 'integer',
                    format: 'int64',
                  },
                  name: {
                    type: 'string',
                  },
                },
                xml: {
                  name: 'Category',
                },
                required: [],
                additionalProperties: true,
              },
              name: {
                type: 'string',
                example: 'doggie',
              },
              photoUrls: {
                type: 'array',
                xml: {
                  wrapped: true,
                },
                items: {
                  type: 'string',
                  xml: {
                    name: 'photoUrl',
                  },
                },
                minItems: 0,
              },
              tags: {
                type: 'array',
                xml: {
                  wrapped: true,
                },
                items: {
                  xml: {
                    name: 'tag',
                  },
                  type: 'object',
                  properties: {
                    id: {
                      type: 'integer',
                      format: 'int64',
                    },
                    name: {
                      type: 'string',
                    },
                  },
                  required: [],
                  additionalProperties: true,
                },
                minItems: 0,
              },
              status: {
                type: 'string',
                description: 'pet status in the store',
                enum: ['available', 'pending', 'sold'],
              },
            },
            xml: {
              name: 'Pet',
            },
            additionalProperties: true,
          },
        },
      },
    },
  },
  updatePetWithForm: {
    type: 'object',
    additionalProperties: false,
    required: ['Params', 'Query', 'Headers', 'RequestBody', 'ResponseBody'],
    properties: {
      Params: {
        type: 'object',
        additionalProperties: false,
        required: ['petId'],
        properties: {
          petId: {
            description: 'ID of pet that needs to be updated',
            type: 'integer',
            nullable: false,
          },
        },
      },
      Query: {
        type: 'object',
        additionalProperties: true,
        required: [],
        properties: {},
      },
      Headers: {
        type: 'object',
        additionalProperties: true,
        required: [],
        properties: {},
      },
      RequestBody: {
        not: {
          oneOf: [
            {
              type: 'string',
            },
            {
              type: 'object',
              required: [],
              additionalProperties: true,
            },
          ],
        },
      },
      ResponseBody: {
        type: 'object',
        additionalProperties: false,
        required: [],
        properties: {},
      },
    },
  },
  deletePet: {
    type: 'object',
    additionalProperties: false,
    required: ['Params', 'Query', 'Headers', 'RequestBody', 'ResponseBody'],
    properties: {
      Params: {
        type: 'object',
        additionalProperties: false,
        required: ['petId'],
        properties: {
          petId: {
            description: 'Pet id to delete',
            type: 'integer',
            nullable: false,
          },
        },
      },
      Query: {
        type: 'object',
        additionalProperties: true,
        required: [],
        properties: {},
      },
      Headers: {
        type: 'object',
        additionalProperties: true,
        required: [],
        properties: {
          api_key: {
            type: 'string',
            nullable: true,
          },
        },
      },
      RequestBody: {
        not: {
          oneOf: [
            {
              type: 'string',
            },
            {
              type: 'object',
              required: [],
              additionalProperties: true,
            },
          ],
        },
      },
      ResponseBody: {
        type: 'object',
        additionalProperties: false,
        required: [],
        properties: {},
      },
    },
  },
  getInventory: {
    type: 'object',
    additionalProperties: false,
    required: ['Params', 'Query', 'Headers', 'RequestBody', 'ResponseBody'],
    properties: {
      Params: {
        type: 'object',
        additionalProperties: false,
        required: [],
        properties: {},
      },
      Query: {
        type: 'object',
        additionalProperties: true,
        required: [],
        properties: {},
      },
      Headers: {
        type: 'object',
        additionalProperties: true,
        required: [],
        properties: {},
      },
      RequestBody: {
        not: {
          oneOf: [
            {
              type: 'string',
            },
            {
              type: 'object',
              required: [],
              additionalProperties: true,
            },
          ],
        },
      },
      ResponseBody: {
        type: 'object',
        additionalProperties: false,
        required: ['200'],
        properties: {
          '200': {
            type: 'object',
            additionalProperties: {
              type: 'integer',
              format: 'int32',
            },
            required: [],
          },
        },
      },
    },
  },
  placeOrder: {
    type: 'object',
    additionalProperties: false,
    required: ['Params', 'Query', 'Headers', 'RequestBody', 'ResponseBody'],
    properties: {
      Params: {
        type: 'object',
        additionalProperties: false,
        required: [],
        properties: {},
      },
      Query: {
        type: 'object',
        additionalProperties: true,
        required: [],
        properties: {},
      },
      Headers: {
        type: 'object',
        additionalProperties: true,
        required: [],
        properties: {},
      },
      RequestBody: {
        type: 'object',
        properties: {
          id: {
            type: 'integer',
            format: 'int64',
          },
          petId: {
            type: 'integer',
            format: 'int64',
          },
          quantity: {
            type: 'integer',
            format: 'int32',
          },
          shipDate: {
            type: 'string',
            format: 'date-time',
          },
          status: {
            type: 'string',
            description: 'Order Status',
            enum: ['placed', 'approved', 'delivered'],
          },
          complete: {
            type: 'boolean',
          },
        },
        xml: {
          name: 'Order',
        },
        required: [],
        additionalProperties: true,
      },
      ResponseBody: {
        type: 'object',
        additionalProperties: false,
        required: ['200'],
        properties: {
          '200': {
            type: 'object',
            properties: {
              id: {
                type: 'integer',
                format: 'int64',
              },
              petId: {
                type: 'integer',
                format: 'int64',
              },
              quantity: {
                type: 'integer',
                format: 'int32',
              },
              shipDate: {
                type: 'string',
                format: 'date-time',
              },
              status: {
                type: 'string',
                description: 'Order Status',
                enum: ['placed', 'approved', 'delivered'],
              },
              complete: {
                type: 'boolean',
              },
            },
            xml: {
              name: 'Order',
            },
            required: [],
            additionalProperties: true,
          },
        },
      },
    },
  },
  getOrderById: {
    type: 'object',
    additionalProperties: false,
    required: ['Params', 'Query', 'Headers', 'RequestBody', 'ResponseBody'],
    properties: {
      Params: {
        type: 'object',
        additionalProperties: false,
        required: ['orderId'],
        properties: {
          orderId: {
            description: 'ID of pet that needs to be fetched',
            type: 'integer',
            maximum: 10,
            minimum: 1,
            nullable: false,
          },
        },
      },
      Query: {
        type: 'object',
        additionalProperties: true,
        required: [],
        properties: {},
      },
      Headers: {
        type: 'object',
        additionalProperties: true,
        required: [],
        properties: {},
      },
      RequestBody: {
        not: {
          oneOf: [
            {
              type: 'string',
            },
            {
              type: 'object',
              required: [],
              additionalProperties: true,
            },
          ],
        },
      },
      ResponseBody: {
        type: 'object',
        additionalProperties: false,
        required: ['200'],
        properties: {
          '200': {
            type: 'object',
            properties: {
              id: {
                type: 'integer',
                format: 'int64',
              },
              petId: {
                type: 'integer',
                format: 'int64',
              },
              quantity: {
                type: 'integer',
                format: 'int32',
              },
              shipDate: {
                type: 'string',
                format: 'date-time',
              },
              status: {
                type: 'string',
                description: 'Order Status',
                enum: ['placed', 'approved', 'delivered'],
              },
              complete: {
                type: 'boolean',
              },
            },
            xml: {
              name: 'Order',
            },
            required: [],
            additionalProperties: true,
          },
        },
      },
    },
  },
  deleteOrder: {
    type: 'object',
    additionalProperties: false,
    required: ['Params', 'Query', 'Headers', 'RequestBody', 'ResponseBody'],
    properties: {
      Params: {
        type: 'object',
        additionalProperties: false,
        required: ['orderId'],
        properties: {
          orderId: {
            description: 'ID of the order that needs to be deleted',
            type: 'integer',
            minimum: 1,
            nullable: false,
          },
        },
      },
      Query: {
        type: 'object',
        additionalProperties: true,
        required: [],
        properties: {},
      },
      Headers: {
        type: 'object',
        additionalProperties: true,
        required: [],
        properties: {},
      },
      RequestBody: {
        not: {
          oneOf: [
            {
              type: 'string',
            },
            {
              type: 'object',
              required: [],
              additionalProperties: true,
            },
          ],
        },
      },
      ResponseBody: {
        type: 'object',
        additionalProperties: false,
        required: [],
        properties: {},
      },
    },
  },
  createUsersWithListInput: {
    type: 'object',
    additionalProperties: false,
    required: ['Params', 'Query', 'Headers', 'RequestBody', 'ResponseBody'],
    properties: {
      Params: {
        type: 'object',
        additionalProperties: false,
        required: [],
        properties: {},
      },
      Query: {
        type: 'object',
        additionalProperties: true,
        required: [],
        properties: {},
      },
      Headers: {
        type: 'object',
        additionalProperties: true,
        required: [],
        properties: {},
      },
      RequestBody: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              format: 'int64',
            },
            username: {
              type: 'string',
            },
            firstName: {
              type: 'string',
            },
            lastName: {
              type: 'string',
            },
            email: {
              type: 'string',
            },
            password: {
              type: 'string',
            },
            phone: {
              type: 'string',
            },
            userStatus: {
              type: 'integer',
              format: 'int32',
              description: 'User Status',
            },
          },
          xml: {
            name: 'User',
          },
          required: [],
          additionalProperties: true,
        },
        minItems: 0,
      },
      ResponseBody: {
        type: 'object',
        additionalProperties: false,
        required: [],
        properties: {},
      },
    },
  },
  getUserByName: {
    type: 'object',
    additionalProperties: false,
    required: ['Params', 'Query', 'Headers', 'RequestBody', 'ResponseBody'],
    properties: {
      Params: {
        type: 'object',
        additionalProperties: false,
        required: ['username'],
        properties: {
          username: {
            description:
              'The name that needs to be fetched. Use user1 for testing. ',
            type: 'string',
            nullable: false,
          },
        },
      },
      Query: {
        type: 'object',
        additionalProperties: true,
        required: [],
        properties: {},
      },
      Headers: {
        type: 'object',
        additionalProperties: true,
        required: [],
        properties: {},
      },
      RequestBody: {
        not: {
          oneOf: [
            {
              type: 'string',
            },
            {
              type: 'object',
              required: [],
              additionalProperties: true,
            },
          ],
        },
      },
      ResponseBody: {
        type: 'object',
        additionalProperties: false,
        required: ['200'],
        properties: {
          '200': {
            type: 'object',
            properties: {
              id: {
                type: 'integer',
                format: 'int64',
              },
              username: {
                type: 'string',
              },
              firstName: {
                type: 'string',
              },
              lastName: {
                type: 'string',
              },
              email: {
                type: 'string',
              },
              password: {
                type: 'string',
              },
              phone: {
                type: 'string',
              },
              userStatus: {
                type: 'integer',
                format: 'int32',
                description: 'User Status',
              },
            },
            xml: {
              name: 'User',
            },
            required: [],
            additionalProperties: true,
          },
        },
      },
    },
  },
  updateUser: {
    type: 'object',
    additionalProperties: false,
    required: ['Params', 'Query', 'Headers', 'RequestBody', 'ResponseBody'],
    properties: {
      Params: {
        type: 'object',
        additionalProperties: false,
        required: ['username'],
        properties: {
          username: {
            description: 'name that need to be updated',
            type: 'string',
            nullable: false,
          },
        },
      },
      Query: {
        type: 'object',
        additionalProperties: true,
        required: [],
        properties: {},
      },
      Headers: {
        type: 'object',
        additionalProperties: true,
        required: [],
        properties: {},
      },
      RequestBody: {
        type: 'object',
        properties: {
          id: {
            type: 'integer',
            format: 'int64',
          },
          username: {
            type: 'string',
          },
          firstName: {
            type: 'string',
          },
          lastName: {
            type: 'string',
          },
          email: {
            type: 'string',
          },
          password: {
            type: 'string',
          },
          phone: {
            type: 'string',
          },
          userStatus: {
            type: 'integer',
            format: 'int32',
            description: 'User Status',
          },
        },
        xml: {
          name: 'User',
        },
        required: [],
        additionalProperties: true,
      },
      ResponseBody: {
        type: 'object',
        additionalProperties: false,
        required: [],
        properties: {},
      },
    },
  },
  deleteUser: {
    type: 'object',
    additionalProperties: false,
    required: ['Params', 'Query', 'Headers', 'RequestBody', 'ResponseBody'],
    properties: {
      Params: {
        type: 'object',
        additionalProperties: false,
        required: ['username'],
        properties: {
          username: {
            description: 'The name that needs to be deleted',
            type: 'string',
            nullable: false,
          },
        },
      },
      Query: {
        type: 'object',
        additionalProperties: true,
        required: [],
        properties: {},
      },
      Headers: {
        type: 'object',
        additionalProperties: true,
        required: [],
        properties: {},
      },
      RequestBody: {
        not: {
          oneOf: [
            {
              type: 'string',
            },
            {
              type: 'object',
              required: [],
              additionalProperties: true,
            },
          ],
        },
      },
      ResponseBody: {
        type: 'object',
        additionalProperties: false,
        required: [],
        properties: {},
      },
    },
  },
  loginUser: {
    type: 'object',
    additionalProperties: false,
    required: ['Params', 'Query', 'Headers', 'RequestBody', 'ResponseBody'],
    properties: {
      Params: {
        type: 'object',
        additionalProperties: false,
        required: [],
        properties: {},
      },
      Query: {
        type: 'object',
        additionalProperties: true,
        required: ['username', 'password'],
        properties: {
          username: {
            description: 'The user name for login',
            type: 'string',
            nullable: false,
          },
          password: {
            description: 'The password for login in clear text',
            type: 'string',
            nullable: false,
          },
        },
      },
      Headers: {
        type: 'object',
        additionalProperties: true,
        required: [],
        properties: {},
      },
      RequestBody: {
        not: {
          oneOf: [
            {
              type: 'string',
            },
            {
              type: 'object',
              required: [],
              additionalProperties: true,
            },
          ],
        },
      },
      ResponseBody: {
        type: 'object',
        additionalProperties: false,
        required: ['200'],
        properties: {
          '200': {
            type: 'string',
          },
        },
      },
    },
  },
  logoutUser: {
    type: 'object',
    additionalProperties: false,
    required: ['Params', 'Query', 'Headers', 'RequestBody', 'ResponseBody'],
    properties: {
      Params: {
        type: 'object',
        additionalProperties: false,
        required: [],
        properties: {},
      },
      Query: {
        type: 'object',
        additionalProperties: true,
        required: [],
        properties: {},
      },
      Headers: {
        type: 'object',
        additionalProperties: true,
        required: [],
        properties: {},
      },
      RequestBody: {
        not: {
          oneOf: [
            {
              type: 'string',
            },
            {
              type: 'object',
              required: [],
              additionalProperties: true,
            },
          ],
        },
      },
      ResponseBody: {
        type: 'object',
        additionalProperties: false,
        required: [],
        properties: {},
      },
    },
  },
  createUsersWithArrayInput: {
    type: 'object',
    additionalProperties: false,
    required: ['Params', 'Query', 'Headers', 'RequestBody', 'ResponseBody'],
    properties: {
      Params: {
        type: 'object',
        additionalProperties: false,
        required: [],
        properties: {},
      },
      Query: {
        type: 'object',
        additionalProperties: true,
        required: [],
        properties: {},
      },
      Headers: {
        type: 'object',
        additionalProperties: true,
        required: [],
        properties: {},
      },
      RequestBody: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              format: 'int64',
            },
            username: {
              type: 'string',
            },
            firstName: {
              type: 'string',
            },
            lastName: {
              type: 'string',
            },
            email: {
              type: 'string',
            },
            password: {
              type: 'string',
            },
            phone: {
              type: 'string',
            },
            userStatus: {
              type: 'integer',
              format: 'int32',
              description: 'User Status',
            },
          },
          xml: {
            name: 'User',
          },
          required: [],
          additionalProperties: true,
        },
        minItems: 0,
      },
      ResponseBody: {
        type: 'object',
        additionalProperties: false,
        required: [],
        properties: {},
      },
    },
  },
  createUser: {
    type: 'object',
    additionalProperties: false,
    required: ['Params', 'Query', 'Headers', 'RequestBody', 'ResponseBody'],
    properties: {
      Params: {
        type: 'object',
        additionalProperties: false,
        required: [],
        properties: {},
      },
      Query: {
        type: 'object',
        additionalProperties: true,
        required: [],
        properties: {},
      },
      Headers: {
        type: 'object',
        additionalProperties: true,
        required: [],
        properties: {},
      },
      RequestBody: {
        type: 'object',
        properties: {
          id: {
            type: 'integer',
            format: 'int64',
          },
          username: {
            type: 'string',
          },
          firstName: {
            type: 'string',
          },
          lastName: {
            type: 'string',
          },
          email: {
            type: 'string',
          },
          password: {
            type: 'string',
          },
          phone: {
            type: 'string',
          },
          userStatus: {
            type: 'integer',
            format: 'int32',
            description: 'User Status',
          },
        },
        xml: {
          name: 'User',
        },
        required: [],
        additionalProperties: true,
      },
      ResponseBody: {
        type: 'object',
        additionalProperties: false,
        required: [],
        properties: {},
      },
    },
  },
}
//  as unknown as {
//   [ID in OperationId]: {
//     properties: {
//       Params: JSONSchemaType<Requests[ID]['Params']>
//       Query: JSONSchemaType<Requests[ID]['Query']>
//       Headers: JSONSchemaType<Requests[ID]['Headers']>
//       RequestBody: JSONSchemaType<Requests[ID]['RequestBody']>
//       ResponseBody: {
//         [Status in OperationId[ID]['ResponseBody']]: JSONSchemaType<
//           Requests[ID]['ResponseBody']
//         >
//       }
//     }
//   }
// }

export interface Requests {
  uploadFile: {
    Params: {
      /**
       * ID of pet to update
       */
      petId: number
    }
    Query: {
      [k: string]: unknown
    }
    Headers: {
      [k: string]: unknown
    }
    RequestBody: {
      [k: string]: unknown
    }
    ResponseBody: {
      '200': ApiResponse
    }
  }
  addPet: {
    Params: {}
    Query: {
      [k: string]: unknown
    }
    Headers: {
      [k: string]: unknown
    }
    RequestBody: Pet
    ResponseBody: {}
  }
  updatePet: {
    Params: {}
    Query: {
      [k: string]: unknown
    }
    Headers: {
      [k: string]: unknown
    }
    RequestBody: Pet
    ResponseBody: {}
  }
  findPetsByStatus: {
    Params: {}
    Query: {
      /**
       * Status values that need to be considered for filter
       */
      status: ('available' | 'pending' | 'sold')[]
      [k: string]: unknown
    }
    Headers: {
      [k: string]: unknown
    }
    RequestBody: {
      [k: string]: unknown
    }
    ResponseBody: {
      '200': Pet[]
    }
  }
  findPetsByTags: {
    Params: {}
    Query: {
      /**
       * Tags to filter by
       */
      tags: string[]
      [k: string]: unknown
    }
    Headers: {
      [k: string]: unknown
    }
    RequestBody: {
      [k: string]: unknown
    }
    ResponseBody: {
      '200': Pet[]
    }
  }
  getPetById: {
    Params: {
      /**
       * ID of pet to return
       */
      petId: number
    }
    Query: {
      [k: string]: unknown
    }
    Headers: {
      [k: string]: unknown
    }
    RequestBody: {
      [k: string]: unknown
    }
    ResponseBody: {
      '200': Pet
    }
  }
  updatePetWithForm: {
    Params: {
      /**
       * ID of pet that needs to be updated
       */
      petId: number
    }
    Query: {
      [k: string]: unknown
    }
    Headers: {
      [k: string]: unknown
    }
    RequestBody: {
      [k: string]: unknown
    }
    ResponseBody: {}
  }
  deletePet: {
    Params: {
      /**
       * Pet id to delete
       */
      petId: number
    }
    Query: {
      [k: string]: unknown
    }
    Headers: {
      api_key?: string
      [k: string]: unknown
    }
    RequestBody: {
      [k: string]: unknown
    }
    ResponseBody: {}
  }
  getInventory: {
    Params: {}
    Query: {
      [k: string]: unknown
    }
    Headers: {
      [k: string]: unknown
    }
    RequestBody: {
      [k: string]: unknown
    }
    ResponseBody: {
      '200': {
        [k: string]: number
      }
    }
  }
  placeOrder: {
    Params: {}
    Query: {
      [k: string]: unknown
    }
    Headers: {
      [k: string]: unknown
    }
    RequestBody: Order
    ResponseBody: {
      '200': Order
    }
  }
  getOrderById: {
    Params: {
      /**
       * ID of pet that needs to be fetched
       */
      orderId: number
    }
    Query: {
      [k: string]: unknown
    }
    Headers: {
      [k: string]: unknown
    }
    RequestBody: {
      [k: string]: unknown
    }
    ResponseBody: {
      '200': Order
    }
  }
  deleteOrder: {
    Params: {
      /**
       * ID of the order that needs to be deleted
       */
      orderId: number
    }
    Query: {
      [k: string]: unknown
    }
    Headers: {
      [k: string]: unknown
    }
    RequestBody: {
      [k: string]: unknown
    }
    ResponseBody: {}
  }
  createUsersWithListInput: {
    Params: {}
    Query: {
      [k: string]: unknown
    }
    Headers: {
      [k: string]: unknown
    }
    RequestBody: User[]
    ResponseBody: {}
  }
  getUserByName: {
    Params: {
      /**
       * The name that needs to be fetched. Use user1 for testing.
       */
      username: string
    }
    Query: {
      [k: string]: unknown
    }
    Headers: {
      [k: string]: unknown
    }
    RequestBody: {
      [k: string]: unknown
    }
    ResponseBody: {
      '200': User
    }
  }
  updateUser: {
    Params: {
      /**
       * name that need to be updated
       */
      username: string
    }
    Query: {
      [k: string]: unknown
    }
    Headers: {
      [k: string]: unknown
    }
    RequestBody: User
    ResponseBody: {}
  }
  deleteUser: {
    Params: {
      /**
       * The name that needs to be deleted
       */
      username: string
    }
    Query: {
      [k: string]: unknown
    }
    Headers: {
      [k: string]: unknown
    }
    RequestBody: {
      [k: string]: unknown
    }
    ResponseBody: {}
  }
  loginUser: {
    Params: {}
    Query: {
      /**
       * The user name for login
       */
      username: string
      /**
       * The password for login in clear text
       */
      password: string
      [k: string]: unknown
    }
    Headers: {
      [k: string]: unknown
    }
    RequestBody: {
      [k: string]: unknown
    }
    ResponseBody: {
      '200': string
    }
  }
  logoutUser: {
    Params: {}
    Query: {
      [k: string]: unknown
    }
    Headers: {
      [k: string]: unknown
    }
    RequestBody: {
      [k: string]: unknown
    }
    ResponseBody: {}
  }
  createUsersWithArrayInput: {
    Params: {}
    Query: {
      [k: string]: unknown
    }
    Headers: {
      [k: string]: unknown
    }
    RequestBody: User[]
    ResponseBody: {}
  }
  createUser: {
    Params: {}
    Query: {
      [k: string]: unknown
    }
    Headers: {
      [k: string]: unknown
    }
    RequestBody: User
    ResponseBody: {}
  }
}
export interface ApiResponse {
  code?: number
  type?: string
  message?: string
  [k: string]: unknown
}
export interface Pet {
  id?: number
  category?: Category
  name: string
  photoUrls: string[]
  tags?: {
    id?: number
    name?: string
    [k: string]: unknown
  }[]
  /**
   * pet status in the store
   */
  status?: 'available' | 'pending' | 'sold'
  [k: string]: unknown
}
export interface Category {
  id?: number
  name?: string
  [k: string]: unknown
}
export interface Order {
  id?: number
  petId?: number
  quantity?: number
  shipDate?: string
  /**
   * Order Status
   */
  status?: 'placed' | 'approved' | 'delivered'
  complete?: boolean
  [k: string]: unknown
}
export interface User {
  id?: number
  username?: string
  firstName?: string
  lastName?: string
  email?: string
  password?: string
  phone?: string
  /**
   * User Status
   */
  userStatus?: number
  [k: string]: unknown
}

interface ResponseSend<T> {
  send(data: T): void
  json(data: T): void
}

type OperationId = keyof Requests

type ResponseStatus<
  ID extends OperationId,
  Code extends number
> = Code extends keyof Requests[ID]['ResponseBody']
  ? Requests[ID]['ResponseBody'][Code]
  : never

type ValidatedRequest<ID extends OperationId> = Request<
  Requests[ID]['Params'],
  Requests[ID]['ResponseBody'][keyof Requests[ID]['ResponseBody']],
  Requests[ID]['RequestBody'],
  Requests[ID]['Query']
>

type ValidatedResponse<ID extends OperationId> = Omit<
  Response,
  'status' | 'send' | 'json'
> & {
  status<Status extends keyof Requests[ID]['ResponseBody']>(
    code: Status
  ): ResponseSend<Requests[ID]['ResponseBody'][Status]>
} & ResponseSend<ResponseStatus<ID, 200>>

type ValidatedResponseReturn<ID extends OperationId> = UnionizeResponses<
  Requests[ID]['ResponseBody']
>

type UnionizeResponses<ResponseDictionary extends object> = {
  [Status in keyof ResponseDictionary]: {
    status: Status
    body: ResponseDictionary[Status]
  }
}[keyof ResponseDictionary]

function getValidators<ID extends OperationId>(operationId: ID) {
  type Req = Requests[ID]
  const { Params, Query, Headers, RequestBody, ResponseBody } =
    schemas[operationId].properties

  return {
    params: ajv.compile<Req['Params']>(Params),
    query: ajv.compile<Req['Query']>(Query),
    headers: ajv.compile<Req['Headers']>(Headers),
    requestBody: ajv.compile<Req['Query']>(RequestBody),
  }
}

function createValidationHandlerWrapper<ID extends OperationId>(
  operationId: ID
) {
  let validate: ReturnType<typeof getValidators>

  return function wrapHandlerWithValidation(
    handler: (
      req: ValidatedRequest<ID>,
      res: ValidatedResponse<ID>,
      next: NextFunction
    ) => Promise<ValidatedResponseReturn<ID>>
  ) {
    validate = validate || getValidators(operationId)

    // TODO: HOC - read function name here for stacktrace
    return function handlerWithValidation(
      req: Request,
      res: Response,
      next: NextFunction
    ) {
      // // type of validate extends `(data: any) => data is Foo`
      // const data: any = { foo: 1 }
      if (!validate.params(req.params)) {
        return next(
          new Error(
            `Validation error: Request path params ${validate.params.errors[0].message}`
          )
        )
      }

      if (!validate.headers(req.headers)) {
        return next(
          new Error(
            `Validation error: Headers ${validate.headers.errors[0].message}`
          )
        )
      }

      if (!validate.query(req.query)) {
        return next(
          new Error(
            `Validation error: Request query ${validate.query.errors[0].message}`
          )
        )
      }

      if (!validate.requestBody(req.body)) {
        return next(
          new Error(
            `Validation error: Request body ${validate.requestBody.errors[0].message}`
          )
        )
      }

      return handler(req, res, next)
    }
  }
}

// TODO: Prepend things to prevent collisions
interface ResponseSend<T> {
  send(data: T): void
  json(data: T): void
}

export const validate = {
  uploadFile: createValidationHandlerWrapper('uploadFile'),
  addPet: createValidationHandlerWrapper('addPet'),
  updatePet: createValidationHandlerWrapper('updatePet'),
  findPetsByStatus: createValidationHandlerWrapper('findPetsByStatus'),
  findPetsByTags: createValidationHandlerWrapper('findPetsByTags'),
  getPetById: createValidationHandlerWrapper('getPetById'),
  updatePetWithForm: createValidationHandlerWrapper('updatePetWithForm'),
  deletePet: createValidationHandlerWrapper('deletePet'),
  getInventory: createValidationHandlerWrapper('getInventory'),
  placeOrder: createValidationHandlerWrapper('placeOrder'),
  getOrderById: createValidationHandlerWrapper('getOrderById'),
  deleteOrder: createValidationHandlerWrapper('deleteOrder'),
  createUsersWithListInput: createValidationHandlerWrapper(
    'createUsersWithListInput'
  ),
  getUserByName: createValidationHandlerWrapper('getUserByName'),
  updateUser: createValidationHandlerWrapper('updateUser'),
  deleteUser: createValidationHandlerWrapper('deleteUser'),
  loginUser: createValidationHandlerWrapper('loginUser'),
  logoutUser: createValidationHandlerWrapper('logoutUser'),
  createUsersWithArrayInput: createValidationHandlerWrapper(
    'createUsersWithArrayInput'
  ),
  createUser: createValidationHandlerWrapper('createUser'),
}
