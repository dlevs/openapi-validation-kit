export default {
  findPets: {
    params: {
      additionalProperties: false,
      type: 'object',
      required: [],
      properties: {},
    },
    query: {
      additionalProperties: true,
      type: 'object',
      required: [],
      properties: {
        tags: {
          description: 'tags to filter by',
          nullable: true,
          type: 'array',
          items: {
            type: 'string',
          },
          minItems: 0,
        },
        limit: {
          description: 'maximum number of results to return',
          nullable: true,
          type: 'integer',
          format: 'int32',
        },
      },
    },
    headers: {
      additionalProperties: true,
      type: 'object',
      required: [],
      properties: {},
    },
    requestBody: {
      description: 'No request body',
    },
    responseBody: {
      '200': {
        type: 'array',
        items: {
          allOf: [
            {
              type: 'object',
              required: ['name'],
              properties: {
                name: {
                  type: 'string',
                },
                tag: {
                  type: 'string',
                },
              },
              additionalProperties: true,
            },
            {
              type: 'object',
              required: ['id'],
              properties: {
                id: {
                  type: 'integer',
                  format: 'int64',
                },
              },
              additionalProperties: true,
            },
          ],
        },
        minItems: 0,
      },
      default: {
        type: 'object',
        required: ['code', 'message', 'type'],
        properties: {
          code: {
            type: 'integer',
            format: 'int32',
          },
          message: {
            type: 'string',
          },
          type: {
            enum: ['general'],
          },
        },
        additionalProperties: true,
      },
    },
  },
  addPet: {
    params: {
      additionalProperties: false,
      type: 'object',
      required: [],
      properties: {},
    },
    query: {
      additionalProperties: true,
      type: 'object',
      required: [],
      properties: {},
    },
    headers: {
      additionalProperties: true,
      type: 'object',
      required: [],
      properties: {},
    },
    requestBody: {
      type: 'object',
      required: ['name'],
      properties: {
        name: {
          type: 'string',
        },
        tag: {
          type: 'string',
        },
      },
      additionalProperties: true,
    },
    responseBody: {
      '200': {
        allOf: [
          {
            type: 'object',
            required: ['name'],
            properties: {
              name: {
                type: 'string',
              },
              tag: {
                type: 'string',
              },
            },
            additionalProperties: true,
          },
          {
            type: 'object',
            required: ['id'],
            properties: {
              id: {
                type: 'integer',
                format: 'int64',
              },
            },
            additionalProperties: true,
          },
        ],
      },
      '4XX': {
        type: 'object',
        required: ['code', 'message', 'type'],
        properties: {
          code: {
            type: 'integer',
            format: 'int32',
          },
          message: {
            type: 'string',
          },
          type: {
            enum: ['bad'],
          },
        },
        additionalProperties: true,
      },
      default: {
        type: 'object',
        required: ['code', 'message', 'type'],
        properties: {
          code: {
            type: 'integer',
            format: 'int32',
          },
          message: {
            type: 'string',
          },
          type: {
            enum: ['general'],
          },
        },
        additionalProperties: true,
      },
    },
  },
  'find pet by id': {
    params: {
      additionalProperties: false,
      type: 'object',
      required: ['id'],
      properties: {
        id: {
          description: 'ID of pet to fetch',
          nullable: false,
          type: 'integer',
          format: 'int64',
        },
      },
    },
    query: {
      additionalProperties: true,
      type: 'object',
      required: [],
      properties: {},
    },
    headers: {
      additionalProperties: true,
      type: 'object',
      required: [],
      properties: {},
    },
    requestBody: {
      description: 'No request body',
    },
    responseBody: {
      '200': {
        allOf: [
          {
            type: 'object',
            required: ['name'],
            properties: {
              name: {
                type: 'string',
              },
              tag: {
                type: 'string',
              },
            },
            additionalProperties: true,
          },
          {
            type: 'object',
            required: ['id'],
            properties: {
              id: {
                type: 'integer',
                format: 'int64',
              },
            },
            additionalProperties: true,
          },
        ],
      },
      default: {
        type: 'object',
        required: ['code', 'message', 'type'],
        properties: {
          code: {
            type: 'integer',
            format: 'int32',
          },
          message: {
            type: 'string',
          },
          type: {
            enum: ['general'],
          },
        },
        additionalProperties: true,
      },
    },
  },
  deletePet: {
    params: {
      additionalProperties: false,
      type: 'object',
      required: ['id'],
      properties: {
        id: {
          description: 'ID of pet to delete',
          nullable: false,
          type: 'integer',
          format: 'int64',
        },
      },
    },
    query: {
      additionalProperties: true,
      type: 'object',
      required: [],
      properties: {},
    },
    headers: {
      additionalProperties: true,
      type: 'object',
      required: [],
      properties: {},
    },
    requestBody: {
      description: 'No request body',
    },
    responseBody: {
      '204': {},
      default: {
        type: 'object',
        required: ['code', 'message', 'type'],
        properties: {
          code: {
            type: 'integer',
            format: 'int32',
          },
          message: {
            type: 'string',
          },
          type: {
            enum: ['general'],
          },
        },
        additionalProperties: true,
      },
    },
  },
}