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
// Network & API Errors
// ============================================================================

export class NetworkError extends AppError {
  constructor(
    code: string = "NETWORK_ERROR",
    errorType: string = "Network error",
    message: string
  ) {
    super(code, errorType, message)
  }
}

export class APIError extends NetworkError {
  constructor(
    message: string,
    public originalError?: unknown
  ) {
    super("API_ERROR", "API service error", message)
  }
}

export class WebSocketError extends NetworkError {
  constructor(
    message: string,
    public originalError?: unknown
  ) {
    super("WEBSOCKET_ERROR", "WebSocket connection error", message)
  }
}

export class FaucetError extends NetworkError {
  constructor(
    message: string,
    public originalError?: unknown
  ) {
    super("FAUCET_ERROR", "Faucet service error", message)
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

export class ContractCallError extends BlockchainError {
  constructor(
    message: string,
    public originalError?: unknown
  ) {
    super("CONTRACT_CALL_ERROR", "Contract call failed", message)
  }
}

export class ChainConfigError extends BlockchainError {
  constructor(
    message: string,
    public chainId?: string
  ) {
    super("CHAIN_CONFIG_ERROR", "Chain configuration error", message)
  }
}

export class WorldAddressNotFoundError extends BlockchainError {
  constructor(chainId: string) {
    super(
      "WORLD_ADDRESS_NOT_FOUND",
      "Chain configuration error",
      `No world address found for chain ${chainId}. Did you run \`mud deploy\`?`
    )
  }
}

export class ConnectorClientUnavailableError extends BlockchainError {
  constructor(message: string = "Connector client is not available") {
    super("CONNECTOR_CLIENT_UNAVAILABLE", "Wallet connection error", message)
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

export class StoreTimeoutError extends StateError {
  constructor(
    message: string,
    public timeout?: number
  ) {
    super("STORE_TIMEOUT_ERROR", "Store operation timeout", message)
  }
}

export class PropertyChangeTimeoutError extends StateError {
  constructor(propertyName: string, timeout: number = 10000) {
    super(
      "PROPERTY_CHANGE_TIMEOUT_ERROR",
      "Property change timeout",
      `Timed out waiting for property '${propertyName}' to change (${timeout}ms)`
    )
  }
}

export class StateSyncError extends StateError {
  constructor(
    message: string,
    public originalError?: unknown
  ) {
    super("STATE_SYNC_ERROR", "State synchronization error", message)
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

export class CMSError extends ContentError {
  constructor(
    message: string,
    public originalError?: unknown
  ) {
    super("CMS_ERROR", "CMS service error", message)
  }
}

export class ContentInitializationError extends ContentError {
  constructor(
    message: string,
    public originalError?: unknown
  ) {
    super("CONTENT_INITIALIZATION_ERROR", "Content initialization error", message)
  }
}

// ============================================================================
// Validation Errors
// ============================================================================

export class ValidationError extends AppError {
  constructor(
    code: string = "VALIDATION_ERROR",
    errorType: string = "Validation failed",
    message: string
  ) {
    super(code, errorType, message)
  }
}

export class InputValidationError extends ValidationError {
  constructor(
    message: string,
    public fieldName?: string,
    public value?: unknown
  ) {
    super("INPUT_VALIDATION_ERROR", "Input validation failed", message)
  }
}

export class ChatValidationError extends ValidationError {
  constructor(
    message: string,
    public messageContent?: string
  ) {
    super("CHAT_VALIDATION_ERROR", "Chat message validation failed", message)
  }
}

export class CharacterLimitError extends ValidationError {
  constructor(currentLength: number, maxLength: number, fieldName: string = "input") {
    super(
      "CHARACTER_LIMIT_ERROR",
      "Character limit exceeded",
      `${fieldName} exceeds character limit: ${currentLength}/${maxLength}`
    )
  }
}

// ============================================================================
// Game-Specific Errors
// ============================================================================

export class GameError extends AppError {
  constructor(code: string = "GAME_ERROR", errorType: string = "Game error", message: string) {
    super(code, errorType, message)
  }
}

export class RoomError extends GameError {
  constructor(
    message: string,
    public roomId?: string
  ) {
    super("ROOM_ERROR", "Room operation error", message)
  }
}

export class RatError extends GameError {
  constructor(
    message: string,
    public ratId?: string
  ) {
    super("RAT_ERROR", "Rat operation error", message)
  }
}

export class SpawnError extends GameError {
  constructor(
    message: string,
    public originalError?: unknown
  ) {
    super("SPAWN_ERROR", "Spawn operation error", message)
  }
}

export class LiquidationError extends GameError {
  constructor(
    message: string,
    public entityId?: string,
    public originalError?: unknown
  ) {
    super("LIQUIDATION_ERROR", "Liquidation operation error", message)
  }
}

export type ExpectedError =
  | AppError
  | NetworkError
  | APIError
  | WebSocketError
  | FaucetError
  | BlockchainError
  | TransactionError
  | ContractCallError
  | ChainConfigError
  | WorldAddressNotFoundError
  | ConnectorClientUnavailableError
  | GraphicsError
  | WebGLError
  | ShaderError
  | WebGLContextError
  | UniformLocationError
  | StateError
  | InvalidStateTransitionError
  | StoreTimeoutError
  | PropertyChangeTimeoutError
  | StateSyncError
  | ContentError
  | JSONParseError
  | CMSError
  | ContentInitializationError
  | ValidationError
  | InputValidationError
  | ChatValidationError
  | CharacterLimitError
  | GameError
  | RoomError
  | RatError
  | SpawnError
  | LiquidationError
