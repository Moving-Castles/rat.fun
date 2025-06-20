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
            items: { 
              type: 'object',
              properties: {
                timestamp: { type: 'string'},
                event: { type: 'string'}
              },
            },
          },
          healthChange: {
            type: 'object',
            properties: {
              logStep: { type: 'number'},
              amount: { type: 'number'}
            },
          },
          outcomeId: {
            type: 'string'
          },
          traitChanges: {
            type: 'array',
            items: { 
              type: 'object',
              properties: {
                logStep: { type: 'number'},
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
                logStep: { type: 'number'},
                type: { type: 'string' },
                id: { type: 'string'},
                name: { type: 'string'},
                value: { type: 'number'}
              },
            },
          },
          balanceTransfer: {
            type: 'object',
            properties: {
              logStep: { type: 'number'},
              from: { type: 'string'},
              to: { type: 'string'},
              amount: { type: 'number'}
            },
          },
          ratDead: { type: 'boolean'},
          roomDepleted: { type: 'boolean'},
          levelUp: { type: 'boolean'},
          levelDown: { type: 'boolean'}
        },
        required: ['log', 'healthChange', 'outcomeId', 'traitChanges', 'itemChanges', 'balanceTransfer', 'ratDead', 'roomDepleted', 'levelUp', 'levelDown']
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