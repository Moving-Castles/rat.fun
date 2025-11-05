/**
 * Logging Module
 *
 * Provides structured logging with configurable output destinations.
 * Logs accumulate per trip and can be written to console and/or Sanity CMS.
 *
 * LOG_LEVEL environment variable controls behavior:
 * 0 => no output
 * 1 => only console.log
 * 2 => only sanity (accumulate logs, write to CMS LogOutput field)
 * 3 => console.log and sanity
 *
 * Note: This is separate from error handling. Sentry errors are still sent regardless of LOG_LEVEL.
 */

type LogLevel = 0 | 1 | 2 | 3

// Parse LOG_LEVEL from environment (default to 1 if not set)
const LOG_LEVEL: LogLevel = parseInt(process.env.LOG_LEVEL || "1") as LogLevel

// Validate LOG_LEVEL
if (![0, 1, 2, 3].includes(LOG_LEVEL)) {
  console.warn(`Invalid LOG_LEVEL: ${process.env.LOG_LEVEL}. Defaulting to 1 (console only).`)
}

// Storage for accumulated logs per trip
const tripLogs = new Map<string, string[]>()

/**
 * Logger class for accumulating logs during a trip
 */
export class TripLogger {
  private tripId: string
  private logs: string[] = []

  constructor(tripId: string) {
    this.tripId = tripId
    // Always start fresh - if logs exist for this tripId, it means cleanup failed
    if (tripLogs.has(tripId)) {
      console.warn(
        `[TripLogger] Warning: Logs already exist for trip ${tripId} - possible memory leak, clearing old logs`
      )
      tripLogs.delete(tripId)
    }
    // Create new log array for this trip
    const logArray: string[] = []
    tripLogs.set(tripId, logArray)
    this.logs = logArray
  }

  /**
   * Log a message (accepts multiple arguments like console.log)
   * @param args - The arguments to log
   */
  log(...args: any[]) {
    // Format the message by stringifying all arguments
    const message = args
      .map(arg => {
        if (typeof arg === "object") {
          return JSON.stringify(arg)
        }
        return String(arg)
      })
      .join(" ")

    const timestamp = new Date().toISOString()
    const logEntry = `[${timestamp}] ${message}`

    // Store in memory if Sanity logging is enabled (LOG_LEVEL 2 or 3)
    if (LOG_LEVEL === 2 || LOG_LEVEL === 3) {
      this.logs.push(logEntry)
    }

    // Output to console if console logging is enabled (LOG_LEVEL 1 or 3)
    if (LOG_LEVEL === 1 || LOG_LEVEL === 3) {
      console.log(...args)
    }
  }

  /**
   * Get all accumulated logs for this trip
   * @returns Array of log entries
   */
  getLogs(): string[] {
    return [...this.logs]
  }

  /**
   * Get all logs as a single string
   * @returns Concatenated log entries
   */
  getLogsAsString(): string {
    return this.logs.join("\n")
  }

  /**
   * Clear logs for this trip (safe to call multiple times)
   */
  clear() {
    this.logs.length = 0
    if (tripLogs.has(this.tripId)) {
      tripLogs.delete(this.tripId)
    }
  }
}

/**
 * Create a new logger for a trip
 * @param tripId - The trip ID
 * @returns A new TripLogger instance
 */
export function createTripLogger(tripId: string): TripLogger {
  return new TripLogger(tripId)
}

/**
 * Get the current LOG_LEVEL
 * @returns The current log level (0-3)
 */
export function getLogLevel(): LogLevel {
  return LOG_LEVEL
}

/**
 * Check if console logging is enabled
 * @returns true if LOG_LEVEL is 1 or 3
 */
export function isConsoleEnabled(): boolean {
  return LOG_LEVEL === 1 || LOG_LEVEL === 3
}

/**
 * Check if Sanity logging is enabled
 * @returns true if LOG_LEVEL is 2 or 3
 */
export function isSanityEnabled(): boolean {
  return LOG_LEVEL === 2 || LOG_LEVEL === 3
}

/**
 * Simple log function for non-trip-specific logging
 * Only outputs to console if LOG_LEVEL is 1 or 3
 * @param message - The message to log
 */
export function log(message: string) {
  if (LOG_LEVEL === 1 || LOG_LEVEL === 3) {
    console.log(message)
  }
}
