import { BaseError } from "viem"
import { UserRejectedTransactionError, parseViemError } from "@ratfun/common/error-handling"

/**
 * Check if an error is a user rejection error (user declined/cancelled the transaction)
 */
export function isUserRejectionError(error: unknown): boolean {
  // Already a UserRejectedTransactionError
  if (error instanceof UserRejectedTransactionError) {
    return true
  }

  // Parse viem errors to check
  if (error instanceof BaseError) {
    // Check viem error name directly first
    if (error.name === "UserRejectedRequestError") {
      return true
    }

    try {
      const parsed = parseViemError(error)
      if (parsed instanceof UserRejectedTransactionError) {
        return true
      }
    } catch {
      // Failed to parse
    }
  }

  // Check error message for common rejection patterns
  if (error instanceof Error) {
    const message = error.message.toLowerCase()
    return (
      message.includes("user rejected") ||
      message.includes("user denied") ||
      message.includes("user cancelled") ||
      message.includes("user canceled") ||
      message.includes("rejected the request")
    )
  }

  return false
}
