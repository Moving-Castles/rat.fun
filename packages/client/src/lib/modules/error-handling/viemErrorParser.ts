import { BaseError } from 'viem'
import {
  TransactionError,
  TransactionRevertedError,
  InsufficientFundsError,
  UserRejectedTransactionError,
  GasEstimationError,
  type ExpectedError
} from './errors'

/**
 * Parses viem errors and converts them to structured AppError instances
 */
export function parseViemError(error: BaseError): ExpectedError {
  // User rejected transaction
  if (error.name === 'UserRejectedRequestError') {
    return new UserRejectedTransactionError(
      error.shortMessage || "User rejected the transaction",
      error
    )
  }

  // Insufficient funds
  if (error.name === 'InsufficientFundsError') {
    return new InsufficientFundsError(
      error.shortMessage || "Insufficient funds for transaction",
      error
    )
  }

  // Gas estimation errors
  if (error.name === 'EstimateGasExecutionError') {
    return new GasEstimationError(
      error.shortMessage || "Failed to estimate gas",
      error
    )
  }

  // Transaction execution errors (reverts, etc.)
  if (error.name === 'TransactionExecutionError') {
    const cause = error.cause as any
    const revertReason = cause?.reason || cause?.shortMessage
    
    if (revertReason) {
      return new TransactionRevertedError(
        `Transaction reverted: ${revertReason}`,
        revertReason,
        error
      )
    }
    
    return new TransactionError(
      error.shortMessage || "Transaction execution failed",
      error
    )
  }

  // Contract execution errors
  if (error.name === 'ContractFunctionExecutionError') {
    const cause = error.cause as any
    const revertReason = cause?.reason || cause?.shortMessage
    
    if (revertReason) {
      return new TransactionRevertedError(
        `Contract call reverted: ${revertReason}`,
        revertReason,
        error
      )
    }
    
    return new TransactionError(
      error.shortMessage || "Contract function execution failed",
      error
    )
  }

  // Generic transaction error fallback
  return new TransactionError(
    error.shortMessage || error.message || "Transaction failed",
    error
  )
}