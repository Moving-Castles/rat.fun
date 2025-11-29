// ============================================================================
// Base Error Class
// ============================================================================

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
// Blockchain & Transaction Errors
// ============================================================================

export class BlockchainError extends AppError {
  constructor(
    code: string = "BLOCKCHAIN_ERROR",
    errorType: string = "Blockchain error",
    message: string
  ) {
    super(code, errorType, message)
  }
}

export class TransactionError extends BlockchainError {
  constructor(
    message: string,
    public originalError?: unknown
  ) {
    super("TRANSACTION_ERROR", "Transaction failed", message)
  }
}

export class TransactionRevertedError extends BlockchainError {
  constructor(
    message: string,
    public reason?: string,
    public originalError?: unknown
  ) {
    super("TRANSACTION_REVERTED", "Transaction reverted", message)
  }
}

export class InsufficientFundsError extends BlockchainError {
  constructor(
    message: string,
    public originalError?: unknown
  ) {
    super("INSUFFICIENT_FUNDS", "Insufficient funds", message)
  }
}

export class UserRejectedTransactionError extends BlockchainError {
  constructor(
    message: string = "User rejected the transaction",
    public originalError?: unknown
  ) {
    super("USER_REJECTED", "Transaction rejected", message)
  }
}

export class GasEstimationError extends BlockchainError {
  constructor(
    message: string,
    public originalError?: unknown
  ) {
    super("GAS_ESTIMATION_ERROR", "Gas estimation failed", message)
  }
}

export class WagmiConfigUnavailableError extends BlockchainError {
  constructor(message: string = "Wagmi config is not available") {
    super("WAGMI_CONFIG_UNAVAILABLE", "Wallet connection error", message)
  }
}

export class NetworkNotInitializedError extends BlockchainError {
  constructor(message: string = "Network not initialized") {
    super("NETWORK_NOT_INITIALIZED", "Network initialization error", message)
  }
}

// ============================================================================
// WebGL & Graphics Errors
// ============================================================================

export class GraphicsError extends AppError {
  constructor(
    code: string = "GRAPHICS_ERROR",
    errorType: string = "Graphics error",
    message: string
  ) {
    super(code, errorType, message)
  }
}

export class WebGLError extends GraphicsError {
  constructor(
    message: string,
    public context?: string
  ) {
    super("WEBGL_ERROR", "WebGL error", message)
  }
}

export class ShaderError extends GraphicsError {
  constructor(
    message: string,
    public shaderType?: string,
    public shaderSource?: string
  ) {
    super("SHADER_ERROR", "Shader compilation error", message)
  }
}

export class WebGLContextError extends GraphicsError {
  constructor(message: string = "Failed to create WebGL context") {
    super("WEBGL_CONTEXT_ERROR", "WebGL context error", message)
  }
}

export class UniformLocationError extends GraphicsError {
  constructor(uniformName: string) {
    super(
      "UNIFORM_LOCATION_ERROR",
      "WebGL uniform error",
      `Could not find uniform location for: ${uniformName}`
    )
  }
}

export class WebGLContextLimitError extends GraphicsError {
  constructor(
    message: string = "Too many active WebGL contexts",
    public activeContexts?: number
  ) {
    super("WEBGL_CONTEXT_LIMIT_ERROR", "WebGL context limit reached", message)
  }
}

export class ShaderInitializationError extends GraphicsError {
  constructor(
    message: string,
    public shaderKey?: string,
    public originalError?: unknown
  ) {
    super("SHADER_INITIALIZATION_ERROR", "Shader initialization failed", message)
  }
}

// ============================================================================
// State Management Errors
// ============================================================================

export class StateError extends AppError {
  constructor(
    code: string = "STATE_ERROR",
    errorType: string = "State management error",
    message: string
  ) {
    super(code, errorType, message)
  }
}

export class InvalidStateTransitionError extends StateError {
  constructor(
    code: string = "INVALID_STATE_TRANSITION_ERROR",
    errorType: string = "State management error",
    message: string
  ) {
    super(code, errorType, message)
  }
}

// ============================================================================
// Content & Data Processing Errors
// ============================================================================

export class ContentError extends AppError {
  constructor(
    code: string = "CONTENT_ERROR",
    errorType: string = "Content processing error",
    message: string
  ) {
    super(code, errorType, message)
  }
}

export class JSONParseError extends ContentError {
  constructor(
    message: string,
    public rawContent?: string
  ) {
    super("JSON_PARSE_ERROR", "JSON parsing error", message)
  }
}

// ============================================================================
// Type Union for Expected Errors
// ============================================================================

export type ExpectedError =
  | AppError
  | BlockchainError
  | TransactionError
  | TransactionRevertedError
  | InsufficientFundsError
  | UserRejectedTransactionError
  | GasEstimationError
  | WagmiConfigUnavailableError
  | NetworkNotInitializedError
  | GraphicsError
  | WebGLError
  | ShaderError
  | WebGLContextError
  | UniformLocationError
  | WebGLContextLimitError
  | ShaderInitializationError
  | StateError
  | InvalidStateTransitionError
  | ContentError
  | JSONParseError
