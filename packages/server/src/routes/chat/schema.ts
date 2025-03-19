export const schema =     {
    body: {
      type: 'object',
      required: ['signature', 'message', 'ratId'],
      properties: {
        signature: { type: 'string', description: 'The cryptographic signature for validation' },
        message: { type: 'string', description: 'Message from rat' },
        ratId: { type: 'string', description: 'The unique identifier for the rat' }
      }
    },
    response: {
      200: {
        type: 'string',
        description: 'Message'
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