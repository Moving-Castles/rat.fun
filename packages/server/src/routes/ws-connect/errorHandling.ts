export class WebSocketError extends Error {
  constructor(
    message: string,
    public code: string
  ) {
    super(message);
    this.name = 'WebSocketError';
  }
}

/**
 * Handle errors in the WebSocket connection handler
 * @param error The error to handle
 * @param socket The WebSocket connection
 */
export function handleError(error: unknown, socket: WebSocket): void {
  console.error('WebSocket Error:', error);
  
  // Handle specific error types
  if (error instanceof WebSocketError) {
    const errorMessage = {
      topic: 'error',
      error: error.message,
      code: error.code,
      timestamp: Date.now()
    };
    socket.send(JSON.stringify(errorMessage));
  } else {
    // Handle generic errors
    const errorMessage = {
      topic: 'error',
      error: 'Internal server error',
      code: 'INTERNAL_ERROR',
      timestamp: Date.now()
    };
    socket.send(JSON.stringify(errorMessage));
  }
}
