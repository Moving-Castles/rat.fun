/**
 * TEMPORARY DEBUG LOGGING
 *
 * This file contains all debug logging for gas handling development.
 * Once gas handling is stable, this entire file can be deleted and all
 * imports/calls to these functions removed.
 */

/**
 * Log bundler client configuration
 */
export function logBundlerClientConfig(config: {
  pollingInterval: number
  hasPaymaster: boolean
  paymasterType?: string
}): void {
  console.log("[Drawbridge/BundlerClient] Config:", {
    pollingInterval: config.pollingInterval,
    hasPaymaster: config.hasPaymaster,
    paymasterType: config.paymasterType
  })
}

/**
 * Log fee estimation start for Base chains
 */
export function logFeeEstimationStart(): void {
  console.log("[Fee Estimator] Estimating fees for Base chain...")
}

/**
 * Log fee estimation results
 */
export function logFeeEstimationResult(data: {
  networkMaxFee: bigint
  cappedMaxFee: bigint
  maxPriorityFeePerGas: bigint
  maxTotalFee: bigint
}): void {
  console.log("[Fee Estimator] Fees:", {
    networkMaxFee: (Number(data.networkMaxFee) / 1e9).toFixed(3) + " gwei",
    cappedMaxFee: (Number(data.cappedMaxFee) / 1e9).toFixed(3) + " gwei",
    maxPriorityFeePerGas: (Number(data.maxPriorityFeePerGas) / 1e9).toFixed(3) + " gwei",
    wasCapped: data.networkMaxFee > data.maxTotalFee
  })
}

/**
 * Log fee estimation fallback
 */
export function logFeeEstimationFallback(error: unknown): void {
  console.warn(
    "[Fee Estimator] Estimation failed, using defaults:",
    error instanceof Error ? error.message : String(error)
  )
}

/**
 * Log bundler RPC method calls
 */
export function logBundlerRpcMethod(method: string): void {
  console.log(`[Bundler RPC] ${method}`)
}

/**
 * Log user operation gas details when sending
 */
export function logUserOperationGas(userOp: {
  callGasLimit: string | bigint
  verificationGasLimit: string | bigint
  preVerificationGas: string | bigint
  maxFeePerGas: string | bigint
  maxPriorityFeePerGas: string | bigint
}): void {
  const callGas = BigInt(userOp.callGasLimit)
  const verifyGas = BigInt(userOp.verificationGasLimit)
  const preVerifyGas = BigInt(userOp.preVerificationGas)
  const maxFee = BigInt(userOp.maxFeePerGas)
  const priorityFee = BigInt(userOp.maxPriorityFeePerGas)

  console.log("[Bundler] Sending user operation with gas:", {
    callGasLimit: callGas.toString(),
    verificationGasLimit: verifyGas.toString(),
    preVerificationGas: preVerifyGas.toString(),
    maxFeePerGas: (Number(maxFee) / 1e9).toFixed(3) + " gwei",
    maxPriorityFeePerGas: (Number(priorityFee) / 1e9).toFixed(3) + " gwei"
  })
}

/**
 * Log gas estimator RPC interception
 */
export function logGasEstimatorRpcMethod(method: string): void {
  console.log("[Gas Estimator] RPC Method:", method)
}

/**
 * Log smart account execute() unwrapping
 */
export function logSmartAccountUnwrap(): void {
  console.log("[Gas Estimator] Unwrapping smart account execute()")
}

/**
 * Log smart account unwrap result
 */
export function logSmartAccountUnwrapResult(selector: string): void {
  console.log("[Gas Estimator] After unwrap, selector:", selector)
}

/**
 * Log MUD callFrom() unwrapping
 */
export function logMudCallFromUnwrap(): void {
  console.log("[Gas Estimator] Unwrapping MUD callFrom()")
}

/**
 * Log MUD callFrom() unwrap result
 */
export function logMudCallFromUnwrapResult(selector: string): void {
  console.log("[Gas Estimator] Final selector:", selector)
}

/**
 * Log detailed gas estimate breakdown
 */
export function logGasEstimateBreakdown(data: {
  selector: string | null
  callGasLimit: bigint
  verificationGasLimit: bigint
  preVerificationGas: bigint
  paymasterVerificationGasLimit: bigint
  paymasterPostOpGasLimit: bigint
  totalGas: bigint
  gasPrice: number | null
}): void {
  console.log("┌─ User Operation Gas Estimate ─────────────────────")
  console.log("│ Function selector:", data.selector)
  console.log("│")
  console.log("│ Gas Breakdown:")
  console.log(
    "│   callGasLimit:               ",
    data.callGasLimit.toString().padStart(7),
    "gas (CUSTOM)"
  )
  console.log(
    "│   verificationGasLimit:       ",
    data.verificationGasLimit.toString().padStart(7),
    "gas (viem default)"
  )
  console.log(
    "│   preVerificationGas:         ",
    data.preVerificationGas.toString().padStart(7),
    "gas (viem default)"
  )
  console.log(
    "│   paymasterVerificationGasLimit:",
    data.paymasterVerificationGasLimit.toString().padStart(5),
    "gas (viem default)"
  )
  console.log(
    "│   paymasterPostOpGasLimit:    ",
    data.paymasterPostOpGasLimit.toString().padStart(7),
    "gas (viem default)"
  )
  console.log("│   ─────────────────────────────────────────────")
  console.log("│   Total gas limit:            ", data.totalGas.toString().padStart(7), "gas")
  console.log("│")
  if (data.gasPrice !== null) {
    console.log("│ Current gas price:", data.gasPrice.toFixed(3), "gwei")
    console.log(
      "│ Estimated max cost:",
      ((Number(data.totalGas) * data.gasPrice) / 1e9).toFixed(6),
      "ETH"
    )
    console.log("│ (To get USD: multiply ETH cost × ETH price)")
  }
  console.log("│")
  console.log("│ Source: Custom callGasLimit + viem defaults for verification")
  console.log("└───────────────────────────────────────────────────")
}

/**
 * Log when no custom gas estimates are configured
 */
export function logNoCustomGasEstimates(): void {
  console.log("[Gas Estimator] No custom gas estimates configured - using viem default")
}

/**
 * Log when no measurement exists for a selector
 */
export function logNoMeasurementForSelector(selector: string | null): void {
  console.log("[Gas Estimator] No measurement for", selector, "- using viem default")
}

/**
 * Log gas estimator error
 */
export function logGasEstimatorError(error: unknown): void {
  console.error("[Gas Estimator] Failed to get default estimate from bundler:", error)
}

/**
 * Log comparison between bundler's default callGasLimit and our measured value
 */
export function logCallGasLimitComparison(data: {
  selector: string | null
  bundlerDefault: bigint
  measured: bigint
}): void {
  const diff = Number(data.measured) - Number(data.bundlerDefault)
  const percentDiff = (diff / Number(data.bundlerDefault)) * 100

  console.log("[Gas Estimator] callGasLimit Comparison:")
  console.log("  Selector:", data.selector)
  console.log("  Bundler default:", data.bundlerDefault.toString())
  console.log("  Our measured:   ", data.measured.toString())
  console.log(
    "  Difference:     ",
    diff > 0 ? "+" + diff : diff,
    `(${percentDiff > 0 ? "+" : ""}${percentDiff.toFixed(1)}%)`
  )
}
