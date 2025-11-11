import * as Sentry from "@sentry/sveltekit"
import { get } from "svelte/store"
import { environment as environmentStore } from "$lib/modules/network"
import { PUBLIC_SENTRY_DSN } from "$env/static/public"
import { version } from "$app/environment"
import { AppError, type ExpectedError } from "./errors"
import { toastManager } from "$lib/modules/ui/toasts.svelte"
import { parseViemError } from "./viemErrorParser"
import { BaseError } from "viem"
export * from "./errors"

export function captureMessage(
  message: string,
  level: Sentry.SeverityLevel = "error",
  context?: Record<string, unknown>
): void {
  if (context) {
    Sentry.withScope((scope: Sentry.Scope) => {
      Object.entries(context).forEach(([key, value]) => {
        scope.setExtra(key, value)
      })
      Sentry.captureMessage(message, level)
    })
  } else {
    Sentry.captureMessage(message, level)
  }
}

export function errorHandler(error: ExpectedError | unknown, message = "") {
  let processedError: ExpectedError | unknown = error

  // Auto-detect and parse viem errors
  if (error instanceof BaseError) {
    try {
      processedError = parseViemError(error)
    } catch (parseError) {
      console.warn("Failed to parse potential viem error:", parseError)
    }
  }

  const errorCode = processedError instanceof AppError ? processedError.code : "UNKNOWN_ERROR"
  const processedMessage =
    processedError instanceof AppError
      ? processedError.message
      : processedError instanceof Error
        ? processedError.message
        : ""
  const messageParts = [message, processedMessage].filter(part => part && part.length > 0)
  const errorMessage = messageParts.length ? `${errorCode}: ${messageParts.join(" ")}` : errorCode

  // Determine severity level based on error type
  let severity: Sentry.SeverityLevel = "error"
  if (processedError instanceof AppError) {
    // User-rejected transactions are info level (not really errors)
    if (processedError.code === "USER_REJECTED") {
      severity = "info"
    }
    // Expected validation and user input errors are warnings
    else if (
      processedError.code.includes("VALIDATION") ||
      processedError.code.includes("CHARACTER_LIMIT")
    ) {
      severity = "warning"
    }
    // Network and temporary issues are info level
    else if (processedError.code.includes("NETWORK") || processedError.code.includes("TIMEOUT")) {
      severity = "info"
    }
    // Critical system errors remain as errors
    else if (
      processedError.code.includes("WEBGL_CONTEXT") ||
      processedError.code.includes("SHADER") ||
      processedError.code.includes("GRAPHICS") ||
      processedError.code.includes("WORLD_ADDRESS")
    ) {
      severity = "error"
    }
  }

  const sentryContext = {
    url: window.location.href,
    errorCode,
    errorMessage,
    errorType: processedError instanceof AppError ? processedError.errorType : "UNKNOWN_ERROR"
  }

  toastManager.add({ message: errorMessage, type: severity })
  captureMessage(errorMessage, severity, sentryContext)

  // Log the error to the console
  console.error(processedError)
}

/**
 * Initialize Sentry with configuration from environment variables
 */
export function initializeSentry(): void {
  const dsn = PUBLIC_SENTRY_DSN
  const release = version // Sveltekit assigned version number
  const tracesSampleRate = parseFloat(import.meta.env.SENTRY_TRACES_SAMPLE_RATE || "0.1")
  const profilesSampleRate = parseFloat(import.meta.env.SENTRY_PROFILES_SAMPLE_RATE || "0.1")

  if (!dsn) {
    console.warn("SENTRY_DSN not provided, Sentry will not be initialized")
    return
  }

  Sentry.init({
    dsn,
    environment: get(environmentStore),
    release,
    tracesSampleRate,
    profilesSampleRate
  })
}
