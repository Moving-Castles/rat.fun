import * as Sentry from "@sentry/sveltekit"
import { PUBLIC_SENTRY_DSN } from "$env/static/public"
import { getEnvironment } from "$lib/modules/network"
import { version } from "$app/environment"
import { AppError, type ExpectedError } from "./errors"
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
  const errorCode = error instanceof AppError ? error.code : "UNKNOWN_ERROR"
  const errorMessage = `${errorCode}: ${message ? message + error?.message : error?.message || ""}`

  // Determine severity level based on error type
  let severity: Sentry.SeverityLevel = "error"
  if (error instanceof AppError) {
    // Expected validation and user input errors are warnings
    if (error.code.includes("VALIDATION") || error.code.includes("CHARACTER_LIMIT")) {
      severity = "warning"
    }
    // Network and temporary issues are info level
    else if (error.code.includes("NETWORK") || error.code.includes("TIMEOUT")) {
      severity = "info"
    }
    // Critical system errors remain as errors
    else if (error.code.includes("WEBGL_CONTEXT") || error.code.includes("WORLD_ADDRESS")) {
      severity = "error"
    }
  }

  const sentryContext = {
    url: window.location.href,
    errorCode,
    errorMessage,
    errorType: error instanceof AppError ? error.errorType : "UNKNOWN_ERROR"
  }

  captureMessage(errorMessage, severity, sentryContext)

  // Log the error to the console
  console.error(error)
}

/**
 * Initialize Sentry with configuration from environment variables
 */
export function initializeSentry(): void {
  const dsn = PUBLIC_SENTRY_DSN
  const environment = getEnvironment(new URL(window.location.href))
  const release = version // Sveltekit assigned version number
  const tracesSampleRate = parseFloat(import.meta.env.SENTRY_TRACES_SAMPLE_RATE || "0.1")
  const profilesSampleRate = parseFloat(import.meta.env.SENTRY_PROFILES_SAMPLE_RATE || "0.1")

  if (!dsn) {
    console.warn("SENTRY_DSN not provided, Sentry will not be initialized")
    return
  }

  Sentry.init({
    dsn,
    environment,
    release,
    tracesSampleRate,
    profilesSampleRate
  })

  console.log(`Sentry initialized for environment: ${environment}`)
}
