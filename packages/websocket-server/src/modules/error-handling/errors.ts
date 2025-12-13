// Base error class for all application errors
export class AppError extends Error {
  constructor(
    public code: string = "APP_ERROR",
    public errorType: string = "Unknown error",
    message: string
  ) {
    super(message)
  }
}

// ============================================================================
// WebSocket Errors
// ============================================================================

export class WebSocketError extends AppError {
  constructor(
    code: string = "WEBSOCKET_ERROR",
    errorType: string = "WebSocket error",
    message: string
  ) {
    super(code, errorType, message)
  }
}

// ============================================================================
// Signature Errors
// ============================================================================

export class SignatureError extends AppError {
  constructor(
    code: string = "SIGNATURE_ERROR",
    errorType: string = "Invalid request",
    message: string
  ) {
    super(code, errorType, message)
  }
}

export class StaleRequestError extends SignatureError {
  constructor(message: string = "Stale request timestamp") {
    super("STALE_REQUEST_ERROR", "Stale request", message)
  }
}

export class NonceUsedError extends SignatureError {
  constructor(message: string = "Nonce already used") {
    super("NONCE_USED_ERROR", "Nonce already used", message)
  }
}

export class PlayerIdMismatchError extends SignatureError {
  constructor(message: string = "Player ID does not match recovered address") {
    super("PLAYER_ID_MISMATCH_ERROR", "Player ID mismatch", message)
  }
}

// ============================================================================
// Chat Errors
// ============================================================================

export class ChatError extends AppError {
  constructor(code: string = "CHAT_ERROR", errorType: string = "Chat error", message: string) {
    super(code, errorType, message)
  }
}

export class RateLimitError extends ChatError {
  constructor(message: string = "Rate limited") {
    super("RATE_LIMIT_ERROR", "Rate limited", message)
  }
}

export class ValidationError extends ChatError {
  constructor(message: string = "Validation failed") {
    super("VALIDATION_ERROR", "Validation error", message)
  }
}
