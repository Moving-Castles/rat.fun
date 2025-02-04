export const schema = {
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
            items: { 
              type: 'object',
              properties: {
                timestamp: { type: 'string'},
                event: { type: 'string'}
              },
            },
          },
          ratA: {
            type: 'object',
            description: 'Rat A',
            properties: {
              id: { type: 'string', description: 'The unique identifier for the rat' },
              statChanges: {
                type: 'object',
                description: 'Changes to stats after the operation',
                properties: {
                  health: { type: 'integer', description: 'Change in health points' }
                },
              },
              traitChanges: {
                type: 'array',
                items: { 
                  type: 'object',
                  properties: {
                    type: { type: 'string' },
                    id: { type: 'string'},
                    name: { type: 'string'},
                    value: { type: 'number'}
                  },
                },
              },
              itemChanges: {
                type: 'array',
                items: { 
                  type: 'object',
                  properties: {
                    type: { type: 'string' },
                    id: { type: 'string'},
                    name: { type: 'string'},
                    value: { type: 'number'}
                  },
                },
              },
              balanceTransfer: {
                type: 'number',
                description: 'The amount of currency transferred to player'
              }
            }
          },
          ratB: {
            type: 'object',
            description: 'Rat A',
            properties: {
              id: { type: 'string', description: 'The unique identifier for the rat' },
              statChanges: {
                type: 'object',
                description: 'Changes to stats after the operation',
                properties: {
                  health: { type: 'integer', description: 'Change in health points' }
                },
              },
              traitChanges: {
                type: 'array',
                items: { 
                  type: 'object',
                  properties: {
                    type: { type: 'string' },
                    id: { type: 'string'},
                    name: { type: 'string'},
                    value: { type: 'number'}
                  },
                },
              },
              itemChanges: {
                type: 'array',
                items: { 
                  type: 'object',
                  properties: {
                    type: { type: 'string' },
                    id: { type: 'string'},
                    name: { type: 'string'},
                    value: { type: 'number'}
                  },
                },
              },
              balanceTransfer: {
                type: 'number',
                description: 'The amount of currency transferred to player'
              }
            }
          },
        },
        required: ['log', 'ratA', 'ratB']
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