export const schema = {
  body: {
    type: "object",
    properties: {
      data: {
        type: "object",
        properties: {
          tripPrompt: { type: "string", description: "The prompt for the trip" },
          tripCreationCost: { type: "number", description: "The creation cost for the trip" },
          // Challenge trip fields
          isChallengeTrip: { type: "boolean", description: "Whether this is a challenge trip" },
          fixedMinValueToEnter: {
            type: "number",
            description: "Fixed minimum rat value to enter (challenge trips only)"
          },
          overrideMaxValuePerWinPercentage: {
            type: "number",
            description: "Override max value per win percentage 1-100 (challenge trips only)"
          }
        },
        required: ["tripPrompt", "tripCreationCost"]
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
          description: "Whether the trip was created successfully"
        },
        tripId: { type: "string", description: "The ID of the created trip" }
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
