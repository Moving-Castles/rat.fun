import type { FastifyError, FastifyReply, FastifyRequest } from "fastify"
import {
  AppError,
  ValidationError,
  AuthorizationError,
  InsufficientBalanceError,
  InvalidPromptError,
  RatOwnershipError,
  RatDeadError,
  TripBalanceError,
  StaleRequestError,
  NonceUsedError,
  DelegationNotFoundError,
  ChainNotFoundError,
  WorldAddressNotFoundError,
  ReplicateError,
  OnchainDataError,
  RatNotFoundError,
  TripNotFoundError,
  PlayerNotFoundError,
  GameConfigNotFoundError,
  SystemCallError,
  ContractCallError,
  OutcomeUpdateError,
  LLMError,
  LLMAPIError,
  LLMParseError,
  CMSError,
  CMSAPIError,
  CMSDataError,
  RedisError,
  RedisConnectionError,
  RedisOperationError,
  RedisDataError
} from "./errors"
import { captureError, captureMessage } from "../sentry"

/**
 * Helper function to create client error responses (400)
 */
function createClientErrorResponse(reply: FastifyReply, request: FastifyRequest, error: AppError) {
  return reply.status(400).send({
    error: error.errorType,
    code: error.code,
    message: error.message,
    timestamp: Date.now(),
    path: request.url
  })
}

/**
 * Helper function to create server error responses (500)
 */
function createServerErrorResponse(reply: FastifyReply, request: FastifyRequest, error: AppError) {
  return reply.status(500).send({
    error: error.errorType,
    code: error.code,
    message: error.message,
    timestamp: Date.now(),
    path: request.url
  })
}

/**
 * Centralized error handler for Fastify
 */
export function errorHandler(error: FastifyError, request: FastifyRequest, reply: FastifyReply) {
  // Log the error with a proper message for the one-line logger
  const errorCode = error instanceof AppError ? error.code : "UNKNOWN_ERROR"
  const errorMessage = `${errorCode}: ${error.message}`

  request.log.error({
    error: error.message,
    stack: error.stack,
    url: request.url,
    method: request.method,
    code: errorCode,
    msg: errorMessage // This will be the main message shown by one-line-logger
  })

  // Capture error in Sentry with additional context
  const sentryContext = {
    url: request.url,
    method: request.method,
    userAgent: request.headers["user-agent"],
    ip: request.ip,
    errorCode,
    errorType: error instanceof AppError ? error.errorType : "UNKNOWN_ERROR"
  }

  // Handle client errors (400)
  if (
    error instanceof ValidationError ||
    error instanceof AuthorizationError ||
    error instanceof InsufficientBalanceError ||
    error instanceof RatNotFoundError ||
    error instanceof TripNotFoundError ||
    error instanceof PlayerNotFoundError ||
    error instanceof GameConfigNotFoundError ||
    error instanceof RatOwnershipError ||
    error instanceof RatDeadError ||
    error instanceof TripBalanceError ||
    error instanceof InvalidPromptError ||
    error instanceof StaleRequestError ||
    error instanceof NonceUsedError ||
    error instanceof DelegationNotFoundError
  ) {
    // For client errors, we still capture them in Sentry but with a warning level
    // as they might indicate issues with our validation or client behavior
    captureMessage(`Client Error: ${errorCode}`, "warning", sentryContext)
    return createClientErrorResponse(reply, request, error)
  }

  // Handle server errors (500)
  if (
    error instanceof ChainNotFoundError ||
    error instanceof WorldAddressNotFoundError ||
    error instanceof ReplicateError ||
    error instanceof OnchainDataError ||
    error instanceof ContractCallError ||
    error instanceof OutcomeUpdateError ||
    error instanceof SystemCallError ||
    error instanceof LLMAPIError ||
    error instanceof LLMParseError ||
    error instanceof LLMError ||
    error instanceof CMSAPIError ||
    error instanceof CMSDataError ||
    error instanceof CMSError ||
    error instanceof RedisError ||
    error instanceof RedisConnectionError ||
    error instanceof RedisOperationError ||
    error instanceof RedisDataError
  ) {
    // Capture server errors in Sentry with error level
    captureError(error, sentryContext)
    return createServerErrorResponse(reply, request, error)
  }

  // Handle Fastify validation errors
  if (error.validation) {
    captureMessage(`Validation Error: ${error.message}`, "warning", {
      ...sentryContext,
      validation: error.validation
    })

    return reply.status(400).send({
      error: "Validation failed",
      code: "VALIDATION_ERROR",
      details: error.validation,
      message: error.message,
      timestamp: Date.now(),
      path: request.url
    })
  }

  // Handle unknown errors
  const isDevelopment = process.env.NODE_ENV === "development"

  // Capture unknown errors in Sentry with error level
  captureError(error, {
    ...sentryContext,
    isDevelopment,
    unknownError: true
  })

  return reply.status(500).send({
    error: "Internal server error",
    code: "INTERNAL_ERROR",
    message: isDevelopment ? error.message : "An unexpected error occurred",
    ...(isDevelopment && { stack: error.stack }),
    timestamp: Date.now(),
    path: request.url
  })
}

/**
 * Handle WebSocket errors and send appropriate messages
 */
export function handleWebSocketError(error: unknown, socket: WebSocket): void {
  console.error("WebSocket Error:", error)

  const baseResponse = {
    error: error instanceof Error ? error.message : String(error),
    code: error instanceof AppError ? error.code : "UNKNOWN_ERROR",
    timestamp: Date.now()
  }

  const errorMessage = {
    topic: "error",
    ...baseResponse
  }

  // Capture WebSocket errors in Sentry
  if (error instanceof Error) {
    captureError(error, {
      context: "websocket",
      errorCode: error instanceof AppError ? error.code : "UNKNOWN_ERROR"
    })
  } else {
    captureMessage(`WebSocket Error: ${String(error)}`, "error", {
      context: "websocket",
      errorType: typeof error
    })
  }

  socket.send(JSON.stringify(errorMessage))
}

/**
 * Handle errors in background processes (outside of main request context)
 */
export function handleBackgroundError(error: unknown, context: string): void {
  const errorCode = error instanceof AppError ? error.code : "UNKNOWN_ERROR"
  const errorMessage = `${errorCode}: ${error instanceof Error ? error.message : String(error)}`

  console.error(`🚨 BACKGROUND ERROR [${context}]:`, {
    message: errorMessage,
    code: errorCode,
    stack: error instanceof Error ? error.stack : undefined,
    context
  })

  // Capture background errors in Sentry
  if (error instanceof Error) {
    captureError(error, {
      context: "background",
      backgroundContext: context,
      errorCode
    })
  } else {
    captureMessage(`Background Error [${context}]: ${String(error)}`, "error", {
      context: "background",
      backgroundContext: context,
      errorType: typeof error
    })
  }
}
