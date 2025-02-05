export const schema = {
    params: {
      type: 'object',
      properties: {
        ratId: { type: 'string', minLength: 1, pattern: '^[a-zA-Z0-9_-]+$' }  // Customize constraints as needed
      },
      required: ['ratId']
    }
  };