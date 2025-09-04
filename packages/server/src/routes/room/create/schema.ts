export const schema = {
  body: {
    type: "object",
    properties: {
      data: {
        type: "object",
        properties: {
          roomPrompt: { type: "string", description: "The prompt for the room" },
          roomCreationCost: { type: "number", description: "The creation cost for the room" }
        },
        required: ["roomPrompt", "roomCreationCost"]
      },
      info: {
        type: "object",
        properties: {
          timestamp: { type: "number" },
          nonce: { type: "number" },
          calledFrom: { type: ["string", "null"] }
        },
        required: ["timestamp", "nonce", "calledFrom"]
      },
      signature: { type: "string" }
    },
    required: ["data", "info", "signature"]
  },
  response: {
    200: {
      type: "object",
      description: "Successful response",
      properties: {
        success: {
          type: "boolean",
          description: "Whether the room was created successfully"
        },
        roomId: { type: "string", description: "The ID of the created room" }
      },
      required: ["success"]
    },
    403: {
      type: "object",
      description: "Error response for forbidden access",
      properties: {
        error: {
          type: "string",
          description: "Error message explaining the issue"
        }
      },
      required: ["error"]
    },
    500: {
      type: "object",
      description: "Error response for internal server issues",
      properties: {
        error: {
          type: "string",
          description: "Error message explaining the issue"
        }
      },
      required: ["error"]
    }
  }
}
