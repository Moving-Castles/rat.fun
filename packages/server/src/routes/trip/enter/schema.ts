export const schema = {
  body: {
    type: "object",
    properties: {
      data: {
        type: "object",
        properties: {
          tripId: { type: "string", description: "The ID of the trip" },
          ratId: { type: "string", description: "The unique identifier for the rat" }
        },
        required: ["tripId", "ratId"]
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
      description: "Successful response with event log and updates",
      properties: {
        log: {
          type: "array",
          items: {
            type: "object",
            properties: {
              timestamp: { type: "string" },
              event: { type: "string" }
            }
          }
        },
        outcomeId: {
          type: "string"
        },
        itemChanges: {
          type: "array",
          items: {
            type: "object",
            properties: {
              logStep: { type: "number" },
              type: { type: "string" },
              id: { type: "string" },
              name: { type: "string" },
              value: { type: "number" }
            }
          }
        },
        balanceTransfers: {
          type: "array",
          items: {
            type: "object",
            properties: {
              logStep: { type: "number" },
              amount: { type: "number" }
            }
          }
        },
        debuggingInfo: {
          type: "object",
          properties: {
            internalText: { type: "string" },
            randomSeed: { type: "number" },
            batchId: { type: "number" }
          }
        },
        ratDead: { type: "boolean" },
        tripDepleted: { type: "boolean" }
      },
      required: ["log", "outcomeId", "itemChanges", "balanceTransfers", "ratDead", "tripDepleted"]
    },
    403: {
      type: "object",
      description: "Error response for forbidden access",
      properties: {
        error: { type: "string", description: "Error message explaining the issue" }
      },
      required: ["error"]
    },
    500: {
      type: "object",
      description: "Error response for internal server issues",
      properties: {
        error: { type: "string", description: "Error message explaining the issue" }
      },
      required: ["error"]
    }
  }
}
