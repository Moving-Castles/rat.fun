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
// CMS Errors
// ============================================================================

export class CMSError extends AppError {
  constructor(
    code: string = "CMS_ERROR",
    errorType: string = "CMS service error",
    message: string
  ) {
    super(code, errorType, message)
  }
}

export class CMSAPIError extends CMSError {
  constructor(
    message: string,
    public originalError?: unknown
  ) {
    super("CMS_API_ERROR", "CMS service error", message)
  }
}

export class CMSDataError extends CMSError {
  constructor(
    message: string,
    public data?: unknown
  ) {
    super("CMS_DATA_ERROR", "CMS service error", message)
  }
}

// ============================================================================
// LLM Errors
// ============================================================================

export class LLMError extends AppError {
  constructor(
    code: string = "LLM_ERROR",
    errorType: string = "LLM processing error",
    message: string
  ) {
    super(code, errorType, message)
  }
}

export class LLMAPIError extends LLMError {
  constructor(
    message: string,
    public originalError?: unknown
  ) {
    super("LLM_API_ERROR", "LLM service unavailable", message)
  }
}

export class LLMParseError extends LLMError {
  constructor(
    message: string,
    public rawText: string
  ) {
    super("LLM_PARSE_ERROR", "LLM processing error", message)
  }
}

export class LLMOverloadedError extends LLMError {
  constructor(
    message: string = "Anthropic API is currently overloaded",
    public originalError?: unknown
  ) {
    super("LLM_OVERLOADED_ERROR", "LLM service overloaded", message)
  }
}

export class LLMTruncatedError extends LLMError {
  constructor(
    message: string,
    public stopReason: string,
    public inputTokens: number,
    public outputTokens: number,
    public maxTokens: number
  ) {
    super("LLM_TRUNCATED_ERROR", "LLM response truncated", message)
  }
}

// ============================================================================
// Onchain Data Errors
// ============================================================================

export class OnchainDataError extends AppError {
  constructor(
    code: string = "ONCHAIN_DATA_ERROR",
    errorType: string = "Onchain data error",
    message: string
  ) {
    super(code, errorType, message)
  }
}

export class RatNotFoundError extends OnchainDataError {
  constructor(ratId: string) {
    super("RAT_NOT_FOUND", "Resource not found", `Rat with ID ${ratId} not found`)
  }
}

export class TripNotFoundError extends OnchainDataError {
  constructor(tripId: string) {
    super("TRIP_NOT_FOUND", "Resource not found", `Trip with ID ${tripId} not found`)
  }
}

export class PlayerNotFoundError extends OnchainDataError {
  constructor(playerId: string) {
    super("PLAYER_NOT_FOUND", "Resource not found", `Player with ID ${playerId} not found`)
  }
}

export class GameConfigNotFoundError extends OnchainDataError {
  constructor(gameConfigEntity: string) {
    super(
      "GAME_CONFIG_NOT_FOUND",
      "Resource not found",
      `Game config not found for entity ${gameConfigEntity}`
    )
  }
}

// ============================================================================
// System Call Errors
// ============================================================================

export class SystemCallError extends AppError {
  constructor(
    code: string = "SYSTEM_CALL_ERROR",
    errorType: string = "System error",
    message: string
  ) {
    super(code, errorType, message)
  }
}

export class ContractCallError extends SystemCallError {
  constructor(
    message: string,
    public originalError?: unknown
  ) {
    super("CONTRACT_CALL_ERROR", "Contract call error", message)
  }
}

export class OutcomeUpdateError extends SystemCallError {
  constructor(
    message: string,
    public originalError?: unknown
  ) {
    super("OUTCOME_UPDATE_ERROR", "System error", message)
  }
}

// ============================================================================
// Outcome Validation Errors
// ============================================================================

export class OutcomeValidationError extends SystemCallError {
  constructor(
    code: string = "OUTCOME_VALIDATION_ERROR",
    errorType: string = "Outcome validation error",
    message: string,
    public context?: Record<string, any>
  ) {
    super(code, errorType, message)
  }
}

export class BalanceTransferMismatchError extends OutcomeValidationError {
  constructor(
    message: string,
    public readonly expected: number,
    public readonly actual: number,
    public readonly ratId: string,
    public readonly isSignFlip: boolean = false,
    additionalContext?: Record<string, any>
  ) {
    const code = isSignFlip ? "BALANCE_SIGN_FLIP_ERROR" : "BALANCE_TRANSFER_MISMATCH_ERROR"
    const errorType = isSignFlip ? "Critical balance sign flip" : "Balance transfer mismatch"
    super(code, errorType, message, {
      expected,
      actual,
      difference: actual - expected,
      ratId,
      isSignFlip,
      ...additionalContext
    })
  }
}

export class ValueConservationError extends OutcomeValidationError {
  constructor(
    public readonly ratValueChange: number,
    public readonly tripValueChange: number,
    public readonly ratId: string,
    public readonly tripId: string
  ) {
    const sum = ratValueChange + tripValueChange
    super(
      "VALUE_CONSERVATION_ERROR",
      "Value conservation violated",
      `Value conservation violated: ratValueChange=${ratValueChange}, tripValueChange=${tripValueChange}, sum=${sum} (expected 0)`,
      {
        ratValueChange,
        tripValueChange,
        sum,
        ratId,
        tripId
      }
    )
  }
}

export class TripBalanceCalculationError extends OutcomeValidationError {
  constructor(
    public readonly oldBalance: number,
    public readonly valueChange: number,
    public readonly expected: number,
    public readonly actual: number,
    public readonly ratId: string,
    public readonly tripId: string
  ) {
    super(
      "TRIP_BALANCE_CALCULATION_ERROR",
      "Trip balance calculation error",
      `Trip balance incorrect: oldBalance=${oldBalance}, valueChange=${valueChange}, expected=${expected}, actual=${actual}`,
      {
        oldBalance,
        valueChange,
        expected,
        actual,
        ratId,
        tripId
      }
    )
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

export class AuthorizationError extends ValidationError {
  constructor(message: string = "Not authorized.") {
    super("AUTHORIZATION_ERROR", "Unauthorized", message)
  }
}

export class InsufficientBalanceError extends ValidationError {
  constructor(message: string = "Not enough balance.") {
    super("INSUFFICIENT_BALANCE_ERROR", "Insufficient balance", message)
  }
}

export class InvalidPromptError extends ValidationError {
  constructor(message: string = "Invalid prompt.") {
    super("INVALID_PROMPT_ERROR", "Invalid prompt", message)
  }
}

export class InvalidTripCreationCostError extends ValidationError {
  constructor(message: string = "Invalid trip creation cost.") {
    super("INVALID_TRIP_CREATION_COST_ERROR", "Invalid trip creation cost", message)
  }
}

export class RatOwnershipError extends ValidationError {
  constructor(message: string = "You are not the owner of the rat.") {
    super("RAT_OWNERSHIP_ERROR", "Rat ownership error", message)
  }
}

export class RatDeadError extends ValidationError {
  constructor(message: string = "The rat is dead.") {
    super("RAT_DEAD_ERROR", "Rat is dead", message)
  }
}

export class RatValueError extends ValidationError {
  constructor(message: string = "The rat has not enough value to enter the trip.") {
    super("RAT_VALUE_ERROR", "Rat value error", message)
  }
}

export class TripBalanceError extends ValidationError {
  constructor(message: string = "The trip balance is negative.") {
    super("TRIP_BALANCE_ERROR", "Trip balance error", message)
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

export class DelegationNotFoundError extends SignatureError {
  constructor(message: string = "Delegation not found") {
    super("DELEGATION_NOT_FOUND_ERROR", "Delegation not found", message)
  }
}

// ============================================================================
// Network Errors
// ============================================================================

export class NetworkError extends AppError {
  constructor(
    code: string = "NETWORK_ERROR",
    errorType: string = "Service unavailable",
    message: string
  ) {
    super(code, errorType, message)
  }
}

export class ChainNotFoundError extends NetworkError {
  constructor(chainId: string) {
    super("CHAIN_NOT_FOUND", "Service unavailable", `Chain ${chainId} not found`)
  }
}

export class WorldAddressNotFoundError extends NetworkError {
  constructor(chainId: string) {
    super(
      "WORLD_ADDRESS_NOT_FOUND",
      "Service unavailable",
      `No world address found for chain ${chainId}. Did you run \`mud deploy\`?`
    )
  }
}

// ============================================================================
// Image Generation Errors
// ============================================================================

export class ImageGenerationError extends AppError {
  constructor(
    code: string = "IMAGE_GENERATION_ERROR",
    errorType: string = "Image generation service unavailable",
    message: string
  ) {
    super(code, errorType, message)
  }
}

export class ReplicateError extends ImageGenerationError {
  constructor(
    message: string,
    public originalError?: unknown
  ) {
    super("REPLICATE_ERROR", "Image generation service unavailable", message)
  }
}

// ============================================================================
// Redis Errors
// ============================================================================

export class RedisError extends AppError {
  constructor(
    code: string = "REDIS_ERROR",
    errorType: string = "Redis service error",
    message: string
  ) {
    super(code, errorType, message)
  }
}

export class RedisConnectionError extends RedisError {
  constructor(
    message: string = "Failed to connect to Redis",
    public originalError?: unknown
  ) {
    super("REDIS_CONNECTION_ERROR", "Redis connection failed", message)
  }
}

export class RedisOperationError extends RedisError {
  constructor(
    message: string,
    public operation: string,
    public originalError?: unknown
  ) {
    super("REDIS_OPERATION_ERROR", "Redis operation failed", message)
  }
}

export class RedisDataError extends RedisError {
  constructor(
    message: string,
    public data?: unknown
  ) {
    super("REDIS_DATA_ERROR", "Redis data error", message)
  }
}
