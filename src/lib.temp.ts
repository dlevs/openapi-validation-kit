import Ajv, { JSONSchemaType } from 'ajv'
import type { Request, Response, NextFunction } from 'express'

// TODO: Options
const ajv = new Ajv({ coerceTypes: true })

const schemas = {
  uploadFile: {
    type: 'object',
    required: ['Params', 'Query', 'Headers', 'RequestBody', 'ResponseBody'],
    additionalProperties: false,
    properties: {
      Params: {
        type: 'object',
        required: ['petId'],
        additionalProperties: false,
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
        required: [],
        additionalProperties: false,
        properties: {},
      },
      Headers: {
        type: 'object',
        required: [],
        additionalProperties: false,
        properties: {},
      },
      RequestBody: {
        type: 'null',
        nullable: true,
      },
      ResponseBody: {
        type: 'object',
        required: ['200'],
        additionalProperties: false,
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
    required: ['Params', 'Query', 'Headers', 'RequestBody', 'ResponseBody'],
    additionalProperties: false,
    properties: {
      Params: {
        type: 'object',
        required: [],
        additionalProperties: false,
        properties: {},
      },
      Query: {
        type: 'object',
        required: [],
        additionalProperties: false,
        properties: {},
      },
      Headers: {
        type: 'object',
        required: [],
        additionalProperties: false,
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
        required: [],
        additionalProperties: false,
        properties: {},
      },
    },
  },
  updatePet: {
    type: 'object',
    required: ['Params', 'Query', 'Headers', 'RequestBody', 'ResponseBody'],
    additionalProperties: false,
    properties: {
      Params: {
        type: 'object',
        required: [],
        additionalProperties: false,
        properties: {},
      },
      Query: {
        type: 'object',
        required: [],
        additionalProperties: false,
        properties: {},
      },
      Headers: {
        type: 'object',
        required: [],
        additionalProperties: false,
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
        required: [],
        additionalProperties: false,
        properties: {},
      },
    },
  },
  findPetsByStatus: {
    type: 'object',
    required: ['Params', 'Query', 'Headers', 'RequestBody', 'ResponseBody'],
    additionalProperties: false,
    properties: {
      Params: {
        type: 'object',
        required: [],
        additionalProperties: false,
        properties: {},
      },
      Query: {
        type: 'object',
        required: ['status'],
        additionalProperties: false,
        properties: {
          status: {
            description: 'Status values that need to be considered for filter',
            type: 'array',
            items: {
              type: 'string',
              enum: ['available', 'pending', 'sold'],
              default: 'available',
            },
            collectionFormat: 'multi',
            nullable: false,
            minItems: 0,
          },
        },
      },
      Headers: {
        type: 'object',
        required: [],
        additionalProperties: false,
        properties: {},
      },
      RequestBody: {
        type: 'null',
        nullable: true,
      },
      ResponseBody: {
        type: 'object',
        required: ['200'],
        additionalProperties: false,
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
    required: ['Params', 'Query', 'Headers', 'RequestBody', 'ResponseBody'],
    additionalProperties: false,
    properties: {
      Params: {
        type: 'object',
        required: [],
        additionalProperties: false,
        properties: {},
      },
      Query: {
        type: 'object',
        required: ['tags'],
        additionalProperties: false,
        properties: {
          tags: {
            description: 'Tags to filter by',
            type: 'array',
            items: {
              type: 'string',
            },
            collectionFormat: 'multi',
            nullable: false,
            minItems: 0,
          },
        },
      },
      Headers: {
        type: 'object',
        required: [],
        additionalProperties: false,
        properties: {},
      },
      RequestBody: {
        type: 'null',
        nullable: true,
      },
      ResponseBody: {
        type: 'object',
        required: ['200'],
        additionalProperties: false,
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
    required: ['Params', 'Query', 'Headers', 'RequestBody', 'ResponseBody'],
    additionalProperties: false,
    properties: {
      Params: {
        type: 'object',
        required: ['petId'],
        additionalProperties: false,
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
        required: [],
        additionalProperties: false,
        properties: {},
      },
      Headers: {
        type: 'object',
        required: [],
        additionalProperties: false,
        properties: {},
      },
      RequestBody: {
        type: 'null',
        nullable: true,
      },
      ResponseBody: {
        type: 'object',
        required: ['200'],
        additionalProperties: false,
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
    required: ['Params', 'Query', 'Headers', 'RequestBody', 'ResponseBody'],
    additionalProperties: false,
    properties: {
      Params: {
        type: 'object',
        required: ['petId'],
        additionalProperties: false,
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
        required: [],
        additionalProperties: false,
        properties: {},
      },
      Headers: {
        type: 'object',
        required: [],
        additionalProperties: false,
        properties: {},
      },
      RequestBody: {
        type: 'null',
        nullable: true,
      },
      ResponseBody: {
        type: 'object',
        required: [],
        additionalProperties: false,
        properties: {},
      },
    },
  },
  deletePet: {
    type: 'object',
    required: ['Params', 'Query', 'Headers', 'RequestBody', 'ResponseBody'],
    additionalProperties: false,
    properties: {
      Params: {
        type: 'object',
        required: ['petId'],
        additionalProperties: false,
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
        required: [],
        additionalProperties: false,
        properties: {},
      },
      Headers: {
        type: 'object',
        required: [],
        additionalProperties: false,
        properties: {
          api_key: {
            type: 'string',
            nullable: true,
          },
        },
      },
      RequestBody: {
        type: 'null',
        nullable: true,
      },
      ResponseBody: {
        type: 'object',
        required: [],
        additionalProperties: false,
        properties: {},
      },
    },
  },
  getInventory: {
    type: 'object',
    required: ['Params', 'Query', 'Headers', 'RequestBody', 'ResponseBody'],
    additionalProperties: false,
    properties: {
      Params: {
        type: 'object',
        required: [],
        additionalProperties: false,
        properties: {},
      },
      Query: {
        type: 'object',
        required: [],
        additionalProperties: false,
        properties: {},
      },
      Headers: {
        type: 'object',
        required: [],
        additionalProperties: false,
        properties: {},
      },
      RequestBody: {
        type: 'null',
        nullable: true,
      },
      ResponseBody: {
        type: 'object',
        required: ['200'],
        additionalProperties: false,
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
    required: ['Params', 'Query', 'Headers', 'RequestBody', 'ResponseBody'],
    additionalProperties: false,
    properties: {
      Params: {
        type: 'object',
        required: [],
        additionalProperties: false,
        properties: {},
      },
      Query: {
        type: 'object',
        required: [],
        additionalProperties: false,
        properties: {},
      },
      Headers: {
        type: 'object',
        required: [],
        additionalProperties: false,
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
        required: ['200'],
        additionalProperties: false,
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
    required: ['Params', 'Query', 'Headers', 'RequestBody', 'ResponseBody'],
    additionalProperties: false,
    properties: {
      Params: {
        type: 'object',
        required: ['orderId'],
        additionalProperties: false,
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
        required: [],
        additionalProperties: false,
        properties: {},
      },
      Headers: {
        type: 'object',
        required: [],
        additionalProperties: false,
        properties: {},
      },
      RequestBody: {
        type: 'null',
        nullable: true,
      },
      ResponseBody: {
        type: 'object',
        required: ['200'],
        additionalProperties: false,
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
    required: ['Params', 'Query', 'Headers', 'RequestBody', 'ResponseBody'],
    additionalProperties: false,
    properties: {
      Params: {
        type: 'object',
        required: ['orderId'],
        additionalProperties: false,
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
        required: [],
        additionalProperties: false,
        properties: {},
      },
      Headers: {
        type: 'object',
        required: [],
        additionalProperties: false,
        properties: {},
      },
      RequestBody: {
        type: 'null',
        nullable: true,
      },
      ResponseBody: {
        type: 'object',
        required: [],
        additionalProperties: false,
        properties: {},
      },
    },
  },
  createUsersWithListInput: {
    type: 'object',
    required: ['Params', 'Query', 'Headers', 'RequestBody', 'ResponseBody'],
    additionalProperties: false,
    properties: {
      Params: {
        type: 'object',
        required: [],
        additionalProperties: false,
        properties: {},
      },
      Query: {
        type: 'object',
        required: [],
        additionalProperties: false,
        properties: {},
      },
      Headers: {
        type: 'object',
        required: [],
        additionalProperties: false,
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
        required: [],
        additionalProperties: false,
        properties: {},
      },
    },
  },
  getUserByName: {
    type: 'object',
    required: ['Params', 'Query', 'Headers', 'RequestBody', 'ResponseBody'],
    additionalProperties: false,
    properties: {
      Params: {
        type: 'object',
        required: ['username'],
        additionalProperties: false,
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
        required: [],
        additionalProperties: false,
        properties: {},
      },
      Headers: {
        type: 'object',
        required: [],
        additionalProperties: false,
        properties: {},
      },
      RequestBody: {
        type: 'null',
        nullable: true,
      },
      ResponseBody: {
        type: 'object',
        required: ['200'],
        additionalProperties: false,
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
    required: ['Params', 'Query', 'Headers', 'RequestBody', 'ResponseBody'],
    additionalProperties: false,
    properties: {
      Params: {
        type: 'object',
        required: ['username'],
        additionalProperties: false,
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
        required: [],
        additionalProperties: false,
        properties: {},
      },
      Headers: {
        type: 'object',
        required: [],
        additionalProperties: false,
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
        required: [],
        additionalProperties: false,
        properties: {},
      },
    },
  },
  deleteUser: {
    type: 'object',
    required: ['Params', 'Query', 'Headers', 'RequestBody', 'ResponseBody'],
    additionalProperties: false,
    properties: {
      Params: {
        type: 'object',
        required: ['username'],
        additionalProperties: false,
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
        required: [],
        additionalProperties: false,
        properties: {},
      },
      Headers: {
        type: 'object',
        required: [],
        additionalProperties: false,
        properties: {},
      },
      RequestBody: {
        type: 'null',
        nullable: true,
      },
      ResponseBody: {
        type: 'object',
        required: [],
        additionalProperties: false,
        properties: {},
      },
    },
  },
  loginUser: {
    type: 'object',
    required: ['Params', 'Query', 'Headers', 'RequestBody', 'ResponseBody'],
    additionalProperties: false,
    properties: {
      Params: {
        type: 'object',
        required: [],
        additionalProperties: false,
        properties: {},
      },
      Query: {
        type: 'object',
        required: ['username', 'password'],
        additionalProperties: false,
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
        required: [],
        additionalProperties: false,
        properties: {},
      },
      RequestBody: {
        type: 'null',
        nullable: true,
      },
      ResponseBody: {
        type: 'object',
        required: ['200'],
        additionalProperties: false,
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
    required: ['Params', 'Query', 'Headers', 'RequestBody', 'ResponseBody'],
    additionalProperties: false,
    properties: {
      Params: {
        type: 'object',
        required: [],
        additionalProperties: false,
        properties: {},
      },
      Query: {
        type: 'object',
        required: [],
        additionalProperties: false,
        properties: {},
      },
      Headers: {
        type: 'object',
        required: [],
        additionalProperties: false,
        properties: {},
      },
      RequestBody: {
        type: 'null',
        nullable: true,
      },
      ResponseBody: {
        type: 'object',
        required: [],
        additionalProperties: false,
        properties: {},
      },
    },
  },
  createUsersWithArrayInput: {
    type: 'object',
    required: ['Params', 'Query', 'Headers', 'RequestBody', 'ResponseBody'],
    additionalProperties: false,
    properties: {
      Params: {
        type: 'object',
        required: [],
        additionalProperties: false,
        properties: {},
      },
      Query: {
        type: 'object',
        required: [],
        additionalProperties: false,
        properties: {},
      },
      Headers: {
        type: 'object',
        required: [],
        additionalProperties: false,
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
        required: [],
        additionalProperties: false,
        properties: {},
      },
    },
  },
  createUser: {
    type: 'object',
    required: ['Params', 'Query', 'Headers', 'RequestBody', 'ResponseBody'],
    additionalProperties: false,
    properties: {
      Params: {
        type: 'object',
        required: [],
        additionalProperties: false,
        properties: {},
      },
      Query: {
        type: 'object',
        required: [],
        additionalProperties: false,
        properties: {},
      },
      Headers: {
        type: 'object',
        required: [],
        additionalProperties: false,
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
        required: [],
        additionalProperties: false,
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
    Query: {}
    Headers: {}
    RequestBody: null
    ResponseBody: {
      '200': ApiResponse
    }
  }
  addPet: {
    Params: {}
    Query: {}
    Headers: {}
    RequestBody: Pet
    ResponseBody: {}
  }
  updatePet: {
    Params: {}
    Query: {}
    Headers: {}
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
    }
    Headers: {}
    RequestBody: null
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
    }
    Headers: {}
    RequestBody: null
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
    Query: {}
    Headers: {}
    RequestBody: null
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
    Query: {}
    Headers: {}
    RequestBody: null
    ResponseBody: {}
  }
  deletePet: {
    Params: {
      /**
       * Pet id to delete
       */
      petId: number
    }
    Query: {}
    Headers: {
      api_key?: string
    }
    RequestBody: null
    ResponseBody: {}
  }
  getInventory: {
    Params: {}
    Query: {}
    Headers: {}
    RequestBody: null
    ResponseBody: {
      '200': {
        [k: string]: number
      }
    }
  }
  placeOrder: {
    Params: {}
    Query: {}
    Headers: {}
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
    Query: {}
    Headers: {}
    RequestBody: null
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
    Query: {}
    Headers: {}
    RequestBody: null
    ResponseBody: {}
  }
  createUsersWithListInput: {
    Params: {}
    Query: {}
    Headers: {}
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
    Query: {}
    Headers: {}
    RequestBody: null
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
    Query: {}
    Headers: {}
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
    Query: {}
    Headers: {}
    RequestBody: null
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
    }
    Headers: {}
    RequestBody: null
    ResponseBody: {
      '200': string
    }
  }
  logoutUser: {
    Params: {}
    Query: {}
    Headers: {}
    RequestBody: null
    ResponseBody: {}
  }
  createUsersWithArrayInput: {
    Params: {}
    Query: {}
    Headers: {}
    RequestBody: User[]
    ResponseBody: {}
  }
  createUser: {
    Params: {}
    Query: {}
    Headers: {}
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
  const { Params, Query, RequestBody, ResponseBody } =
    schemas[operationId].properties

  return {
    params: ajv.compile<Req['Params']>(Params),
    query: ajv.compile<Req['Query']>(Query),
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
