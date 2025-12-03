/**
 * Drawbridge logger
 *
 * A simple conditional logger that can be toggled on/off via configuration.
 * All logging is disabled by default.
 */

let loggingEnabled = false

/**
 * Set whether logging is enabled
 * Called during Drawbridge initialization
 */
export function setLoggingEnabled(enabled: boolean): void {
  loggingEnabled = enabled
}

/**
 * Check if logging is enabled
 */
export function isLoggingEnabled(): boolean {
  return loggingEnabled
}

/**
 * Logger with conditional output
 * Only logs when logging is enabled
 */
export const logger = {
  log: (...args: unknown[]): void => {
    if (loggingEnabled) {
      console.log(...args)
    }
  },
  warn: (...args: unknown[]): void => {
    if (loggingEnabled) {
      console.warn(...args)
    }
  },
  error: (...args: unknown[]): void => {
    // Errors are always logged regardless of logging setting
    console.error(...args)
  }
}
