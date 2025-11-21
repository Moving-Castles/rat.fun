/**
 * Logging for user operation gas and cost tracking
 */

import { formatGwei, formatEther } from "viem"

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

  console.log("┌─ User Operation Gas & Cost ────────────────────────")
  console.log("│")
  console.log("│ Gas Estimates:")
  console.log("│   callGasLimit:                ", callGas.toString().padStart(7), "gas")
  console.log("│   verificationGasLimit:        ", verificationGas.toString().padStart(7), "gas")
  console.log("│   preVerificationGas:          ", preVerificationGas.toString().padStart(7), "gas")
  if (paymasterVerificationGas > 0n) {
    console.log(
      "│   paymasterVerificationGasLimit:",
      paymasterVerificationGas.toString().padStart(7),
      "gas"
    )
  }
  if (paymasterPostOpGas > 0n) {
    console.log(
      "│   paymasterPostOpGasLimit:     ",
      paymasterPostOpGas.toString().padStart(7),
      "gas"
    )
  }
  console.log("│   ─────────────────────────────────────────────")
  console.log("│   Total gas:                   ", totalGas.toString().padStart(7), "gas")
  console.log("│")
  console.log("│ Fee Parameters:")
  console.log("│   maxFeePerGas:                ", formatGwei(maxFeePerGas), "gwei")
  console.log("│   maxPriorityFeePerGas:        ", formatGwei(maxPriorityFeePerGas), "gwei")
  console.log("│")
  console.log("│ Estimated Max Cost:")
  console.log("│   ETH:  ", maxCostETH, "ETH")
  console.log("│   USD:  $" + maxCostUSD.toFixed(2), "(at $" + ETH_PRICE + " ETH)")
  console.log("│")
  console.log("└────────────────────────────────────────────────────")
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

  console.log("┌─ ⚠️  GAS PRICE SPIKE - FEE CAP APPLIED ────────────")
  console.log("│")
  console.log("│ 🛡️  Budget Protection: Capping fees to stay under $" + data.maxBudgetUSD)
  console.log("│")
  console.log("│ This operation:")
  console.log("│   Total gas:            ", data.totalGas.toString(), "gas")
  console.log("│")
  console.log("│ Network fees would cost:")
  console.log("│   maxFeePerGas:         ", formatGwei(data.originalMaxFee), "gwei")
  console.log("│   maxPriorityFeePerGas: ", formatGwei(data.originalPriorityFee), "gwei")
  console.log("│   Estimated cost:       ", originalCost.toFixed(8), "ETH")
  console.log("│   USD cost:              $" + originalCostUSD.toFixed(2), "← OVER BUDGET!")
  console.log("│")
  console.log("│ Capped to:")
  console.log("│   maxFeePerGas:         ", formatGwei(data.cappedMaxFee), "gwei", "← CAPPED")
  if (priorityWasReduced) {
    console.log(
      "│   maxPriorityFeePerGas: ",
      formatGwei(data.cappedPriorityFee),
      "gwei",
      "← REDUCED (EIP-1559)"
    )
  } else {
    console.log("│   maxPriorityFeePerGas: ", formatGwei(data.cappedPriorityFee), "gwei")
  }
  console.log("│   Estimated cost:       ", cappedCost.toFixed(8), "ETH")
  console.log("│   USD cost:              $" + cappedCostUSD.toFixed(2), "✅")
  console.log("│")
  console.log(
    "│ ⏳ Transaction will wait in mempool until gas drops below",
    formatGwei(data.cappedMaxFee),
    "gwei"
  )
  console.log("│")
  console.log("└────────────────────────────────────────────────────")
}
