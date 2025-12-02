import * as Sentry from "@sentry/node"

/**
 * Initialize Sentry with configuration from environment variables
 */
export function initializeSentry(): void {
  const dsn = process.env.SENTRY_DSN
  const environment = process.env.ENVIRONMENT_NAME || "development"
  const release = process.env.APP_VERSION || "unknown"
  const tracesSampleRate = parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE || "0.1")
  const profilesSampleRate = parseFloat(process.env.SENTRY_PROFILES_SAMPLE_RATE || "0.1")

  if (!dsn) {
    console.warn("SENTRY_DSN not provided, Sentry will not be initialized")
    return
  }

  Sentry.init({
    dsn,
    environment,
    release,
    tracesSampleRate,
    profilesSampleRate,
    beforeSend(event, hint) {
      // Add rawText from LLM errors (LLMParseError, LLMSchemaError) to the event context
      const error = hint.originalException
      if (error && typeof error === "object" && "rawText" in error) {
        event.extra = {
          ...event.extra,
          llmRawResponse: (error as { rawText: string }).rawText
        }
      }
      return event
    }
  })

  console.log(`Sentry initialized for environment: ${environment}`)
}

/**
 * Capture an error with additional context
 */
export function captureError(error: Error, context?: Record<string, any>): void {
  if (context) {
    Sentry.withScope((scope: Sentry.Scope) => {
      Object.entries(context).forEach(([key, value]) => {
        scope.setExtra(key, value)
      })
      Sentry.captureException(error)
    })
  } else {
    Sentry.captureException(error)
  }
}

/**
 * Capture a message with additional context
 */
export function captureMessage(
  message: string,
  level: Sentry.SeverityLevel = "error",
  context?: Record<string, any>
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

/**
 * Set user context for Sentry
 */
export function setUser(user: { id: string; username?: string; email?: string }): void {
  Sentry.setUser(user)
}

/**
 * Set tag for Sentry
 */
export function setTag(key: string, value: string): void {
  Sentry.setTag(key, value)
}

/**
 * Set extra context for Sentry
 */
export function setExtra(key: string, value: any): void {
  Sentry.setExtra(key, value)
}

/**
 * Close Sentry (call this before process exit)
 */
export function closeSentry(): Promise<boolean> {
  return Sentry.close()
}
