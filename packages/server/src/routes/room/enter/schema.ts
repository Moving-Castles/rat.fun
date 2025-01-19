export const schema =     {
    body: {
      type: 'object',
      required: ['signature', 'roomId', 'ratId'],
      properties: {
        signature: { type: 'string', description: 'The cryptographic signature for validation' },
        roomId: { type: 'string', description: 'The ID of the room' },
        ratId: { type: 'string', description: 'The unique identifier for the rat' }
      }
    },
    response: {
      200: {
        type: 'object',
        description: 'Successful response with event log and updates',
        properties: {
          log: {
            type: 'array',
            items: { type: 'string' },
            description: 'An array of events that occurred'
          },
          newItems: {
            type: 'array',
            items: { type: 'string' },
            description: 'An array of new items added to the player inventory'
          },
          traitChanges: {
            type: 'array',
            items: { 
              type: 'object',
              properties: {
                type: { type: 'string' },
                id: { type: 'string'},
                name: { type: 'string'},
              },
             },
          },
          statChanges: {
            type: 'object',
            description: 'Changes to stats after the operation',
            properties: {
              health: { type: 'integer', description: 'Change in health points' },
              level: { type: 'integer', description: 'Change in level points' },
            },
          }
        },
        required: ['log', 'traitChanges', 'statChanges']
      },
      403: {
        type: 'object',
        description: 'Error response for forbidden access',
        properties: {
          error: { type: 'string', description: 'Error message explaining the issue' }
        },
        required: ['error']
      },
      500: {
        type: 'object',
        description: 'Error response for internal server issues',
        properties: {
          error: { type: 'string', description: 'Error message explaining the issue' }
        },
        required: ['error']
      }
    }
  }