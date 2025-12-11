import { BaseError } from "viem"
import { slice, decodeErrorResult } from "viem"
import {
  TransactionError,
  TransactionRevertedError,
  InsufficientFundsError,
  UserRejectedTransactionError,
  GasEstimationError,
  type ExpectedError
} from "./errors"
import { ABIS } from "./abi"

/**
 * Decodes hex revert data to extract function selector and parameters
 */
function decodeRevertData(hexData: string) {
  const selector = slice(hexData as `0x${string}`, 0, 4)
  const parametersHex = slice(hexData as `0x${string}`, 4)

  // Try to decode using each ABI
  for (const abi of ABIS) {
    try {
      const decoded = decodeErrorResult({
        abi,
        data: hexData as `0x${string}`
      })

      if (decoded) {
        const argsString = decoded.args ? `(${decoded.args.join(", ")})` : ""
        return `${decoded.errorName}${argsString}`
      }
    } catch {
      // Continue to next ABI if this one doesn't match
      continue
    }
  }

  // Fallback if no ABI matches
  // Note: slice() already returns hex strings, no need for toHex()
  return `Unknown error: Selector ${selector}, Data: ${parametersHex}`
}

/**
 * Extracts revert data from error messages
 */
function extractRevertData(errorMessage: string): string | null {
  // First try to match "with reason: 0x..." pattern
  const reasonPattern = /with reason:\s*(0x[a-fA-F0-9]+)/
  const reasonMatch = errorMessage.match(reasonPattern)
  if (reasonMatch) {
    return reasonMatch[1]
  }

  // Fallback to any hex string with 8+ chars
  const hexPattern = /0x[a-fA-F0-9]{8,}/g
  const matches = errorMessage.match(hexPattern)
  return matches ? matches[0] : null
}

/**
 * Parses viem errors and converts them to structured AppError instances
 */
export function parseViemError(error: BaseError): ExpectedError {
  console.log("parseViemError", error)

  // User rejected transaction
  if (error.name === "UserRejectedRequestError") {
    return new UserRejectedTransactionError(
      error.shortMessage || "User rejected the transaction",
      error
    )
  }

  // Insufficient funds
  if (error.name === "InsufficientFundsError") {
    return new InsufficientFundsError(
      error.shortMessage || "Insufficient funds for transaction",
      error
    )
  }

  // Gas estimation errors
  if (error.name === "EstimateGasExecutionError") {
    return new GasEstimationError(error.shortMessage || "Failed to estimate gas", error)
  }

  // Transaction execution errors (reverts, etc.)
  if (error.name === "TransactionExecutionError" || error.name === "UserOperationExecutionError") {
    const cause = error.cause as any

    // Check if the cause is a user rejection (wrapped in TransactionExecutionError)
    if (cause?.name === "UserRejectedRequestError") {
      return new UserRejectedTransactionError(
        cause.shortMessage || "User rejected the transaction",
        error
      )
    }

    let revertReason = cause?.reason || cause?.shortMessage

    // Try to decode revert data if present
    const fullMessage = error.message || error.shortMessage || ""
    const revertData = extractRevertData(fullMessage)

    if (revertData) {
      const decoded = decodeRevertData(revertData)

      if (decoded) {
        revertReason = decoded
      }
    }

    if (revertReason) {
      return new TransactionRevertedError(
        `Transaction reverted: ${revertReason}`,
        revertReason,
        error
      )
    }

    return new TransactionError(error.shortMessage || "Transaction execution failed", error)
  }

  // Contract execution errors
  if (error.name === "ContractFunctionExecutionError") {
    const cause = error.cause as any
    let revertReason = cause?.reason || cause?.shortMessage

    // Try to decode revert data if present
    const fullMessage = error.message || error.shortMessage || ""
    const revertData = extractRevertData(fullMessage)

    if (revertData) {
      const decoded = decodeRevertData(revertData)
      if (decoded) {
        revertReason = revertReason ? `${revertReason} (${decoded})` : decoded
      }
    }

    if (revertReason) {
      return new TransactionRevertedError(
        `Contract call reverted: ${revertReason}`,
        revertReason,
        error
      )
    }

    return new TransactionError(error.shortMessage || "Contract function execution failed", error)
  }

  // Generic transaction error fallback
  return new TransactionError(error.shortMessage || error.message || "Transaction failed", error)
}
