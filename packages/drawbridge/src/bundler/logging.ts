/**
 * Logging for user operation gas and cost tracking
 */

import { formatGwei, formatEther } from "viem"
import { logger } from "../logger"

const DEFAULT_ETH_PRICE = 2800

/**
 * Log user operation gas estimates and USD cost
 *
 * @param userOp User operation with gas and fee parameters
 * @param ethPriceUSD Current ETH price in USD (defaults to $2,800)
 */
export function logUserOperationCost(
  userOp: {
    callGasLimit: string | bigint
    verificationGasLimit: string | bigint
    preVerificationGas: string | bigint
    paymasterVerificationGasLimit?: string | bigint
    paymasterPostOpGasLimit?: string | bigint
    maxFeePerGas: string | bigint
    maxPriorityFeePerGas: string | bigint
  },
  ethPriceUSD?: number
): void {
  const ETH_PRICE = ethPriceUSD || DEFAULT_ETH_PRICE
  const callGas = BigInt(userOp.callGasLimit)
  const verificationGas = BigInt(userOp.verificationGasLimit)
  const preVerificationGas = BigInt(userOp.preVerificationGas)
  const paymasterVerificationGas = BigInt(userOp.paymasterVerificationGasLimit || 0)
  const paymasterPostOpGas = BigInt(userOp.paymasterPostOpGasLimit || 0)
  const maxFeePerGas = BigInt(userOp.maxFeePerGas)
  const maxPriorityFeePerGas = BigInt(userOp.maxPriorityFeePerGas)

  const totalGas =
    callGas + verificationGas + preVerificationGas + paymasterVerificationGas + paymasterPostOpGas

  // Calculate max cost in ETH and USD
  const maxCostWei = totalGas * maxFeePerGas
  const maxCostETH = formatEther(maxCostWei)
  const maxCostUSD = Number(maxCostETH) * ETH_PRICE

  logger.log("┌─ User Operation Gas & Cost ────────────────────────")
  logger.log("│")
  logger.log("│ Gas Estimates:")
  logger.log("│   callGasLimit:                ", callGas.toString().padStart(7), "gas")
  logger.log("│   verificationGasLimit:        ", verificationGas.toString().padStart(7), "gas")
  logger.log("│   preVerificationGas:          ", preVerificationGas.toString().padStart(7), "gas")
  if (paymasterVerificationGas > 0n) {
    logger.log(
      "│   paymasterVerificationGasLimit:",
      paymasterVerificationGas.toString().padStart(7),
      "gas"
    )
  }
  if (paymasterPostOpGas > 0n) {
    logger.log(
      "│   paymasterPostOpGasLimit:     ",
      paymasterPostOpGas.toString().padStart(7),
      "gas"
    )
  }
  logger.log("│   ─────────────────────────────────────────────")
  logger.log("│   Total gas:                   ", totalGas.toString().padStart(7), "gas")
  logger.log("│")
  logger.log("│ Fee Parameters:")
  logger.log("│   maxFeePerGas:                ", formatGwei(maxFeePerGas), "gwei")
  logger.log("│   maxPriorityFeePerGas:        ", formatGwei(maxPriorityFeePerGas), "gwei")
  logger.log("│")
  logger.log("│ Estimated Max Cost:")
  logger.log("│   ETH:  ", maxCostETH, "ETH")
  logger.log("│   USD:  $" + maxCostUSD.toFixed(2), "(at $" + ETH_PRICE + " ETH)")
  logger.log("│")
  logger.log("└────────────────────────────────────────────────────")
}

/**
 * Log when fee cap is applied due to budget constraints
 */
export function logFeeCapApplied(data: {
  totalGas: bigint
  originalMaxFee: bigint
  originalPriorityFee: bigint
  cappedMaxFee: bigint
  cappedPriorityFee: bigint
  maxBudgetUSD: number
  ethPrice: number
}): void {
  const originalCost = (Number(data.totalGas) * Number(formatGwei(data.originalMaxFee))) / 1e9
  const cappedCost = (Number(data.totalGas) * Number(formatGwei(data.cappedMaxFee))) / 1e9
  const originalCostUSD = originalCost * data.ethPrice
  const cappedCostUSD = cappedCost * data.ethPrice

  const priorityWasReduced = data.cappedPriorityFee < data.originalPriorityFee

  logger.log("┌─ ⚠️  GAS PRICE SPIKE - FEE CAP APPLIED ────────────")
  logger.log("│")
  logger.log("│ 🛡️  Budget Protection: Capping fees to stay under $" + data.maxBudgetUSD)
  logger.log("│")
  logger.log("│ This operation:")
  logger.log("│   Total gas:            ", data.totalGas.toString(), "gas")
  logger.log("│")
  logger.log("│ Network fees would cost:")
  logger.log("│   maxFeePerGas:         ", formatGwei(data.originalMaxFee), "gwei")
  logger.log("│   maxPriorityFeePerGas: ", formatGwei(data.originalPriorityFee), "gwei")
  logger.log("│   Estimated cost:       ", originalCost.toFixed(8), "ETH")
  logger.log("│   USD cost:              $" + originalCostUSD.toFixed(2), "← OVER BUDGET!")
  logger.log("│")
  logger.log("│ Capped to:")
  logger.log("│   maxFeePerGas:         ", formatGwei(data.cappedMaxFee), "gwei", "← CAPPED")
  if (priorityWasReduced) {
    logger.log(
      "│   maxPriorityFeePerGas: ",
      formatGwei(data.cappedPriorityFee),
      "gwei",
      "← REDUCED (EIP-1559)"
    )
  } else {
    logger.log("│   maxPriorityFeePerGas: ", formatGwei(data.cappedPriorityFee), "gwei")
  }
  logger.log("│   Estimated cost:       ", cappedCost.toFixed(8), "ETH")
  logger.log("│   USD cost:              $" + cappedCostUSD.toFixed(2), "✅")
  logger.log("│")
  logger.log(
    "│ ⏳ Transaction will wait in mempool until gas drops below",
    formatGwei(data.cappedMaxFee),
    "gwei"
  )
  logger.log("│")
  logger.log("└────────────────────────────────────────────────────")
}
