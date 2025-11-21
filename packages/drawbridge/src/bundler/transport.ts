import { Chain, http, parseEther } from "viem"
import { logUserOperationCost, logFeeCapApplied } from "./logging"

/**
 * Get bundler RPC transport for a chain
 *
 * Bundlers are special RPC endpoints that handle ERC-4337 user operations.
 * They submit user operations to the EntryPoint contract and handle gas sponsorship.
 *
 * For Base chains, this transport applies dynamic fee capping to keep costs under
 * the Coinbase paymaster's $1 limit.
 *
 * The bundler URL must be configured in the chain's rpcUrls.bundler.http array.
 *
 * @param chain Chain configuration with bundler RPC URL
 * @param ethPriceUSD Current ETH price in USD (used for fee cap calculation)
 * @returns HTTP transport for the bundler
 * @throws If chain doesn't have a bundler RPC URL configured
 */
export function getBundlerTransport(chain: Chain, ethPriceUSD?: number) {
  const bundlerHttpUrl = chain.rpcUrls.bundler?.http[0]

  if (bundlerHttpUrl) {
    // Apply fee capping only for Base chains (Coinbase paymaster budget protection)
    const shouldApplyFeeCap = chain.id === 8453 || chain.id === 84532

    return http(bundlerHttpUrl, {
      onFetchRequest: async request => {
        try {
          if (request.body) {
            const clonedRequest = request.clone()
            const text = await clonedRequest.text()
            const body = JSON.parse(text)

            // Apply fee cap and log user operation details when sending
            if (body?.method === "eth_sendUserOperation") {
              const userOp = body?.params?.[0]
              if (userOp && shouldApplyFeeCap) {
                applyFeeCap(userOp, ethPriceUSD)
              }
              if (userOp) {
                logUserOperationCost(userOp, ethPriceUSD)
              }
            }
          }
        } catch (e) {
          // Silently ignore parsing errors
        }
      }
    })
  }

  throw new Error(`Chain ${chain.id} config did not include a bundler RPC URL.`)
}

/**
 * Apply dynamic fee cap to user operation to stay under $0.90
 *
 * Budget protection for Coinbase paymaster's $1 limit:
 * - Calculates max fee based on actual total gas
 * - Caps maxFeePerGas to keep cost under $0.90 (10% safety margin)
 * - Also caps maxPriorityFeePerGas if needed (EIP-1559 compliance)
 * - Modifies userOp in-place
 *
 * @param userOp User operation to modify
 * @param ethPriceUSD Current ETH price in USD (adds $500 margin for safety)
 */
function applyFeeCap(userOp: any, ethPriceUSD?: number): void {
  // Budget constraints
  const MAX_COST_USD = 0.9 // $0.90 (10% margin under $1 paymaster limit)
  const DEFAULT_ETH_PRICE = 3000
  const PRICE_MARGIN = 500 // Add $500 margin for safety
  const ETH_PRICE_USD = (ethPriceUSD || DEFAULT_ETH_PRICE) + PRICE_MARGIN

  // Calculate total gas for this specific operation
  const totalGas =
    BigInt(userOp.callGasLimit || 0) +
    BigInt(userOp.verificationGasLimit || 0) +
    BigInt(userOp.preVerificationGas || 0) +
    BigInt(userOp.paymasterVerificationGasLimit || 0) +
    BigInt(userOp.paymasterPostOpGasLimit || 0)

  // Calculate maximum fee per gas to stay under budget
  // Formula: maxFeePerGas = ($0.90 / $3,500) / totalGas
  const maxBudgetETH = parseEther((MAX_COST_USD / ETH_PRICE_USD).toString())
  const maxFeePerGasCap = maxBudgetETH / totalGas

  const originalMaxFee = BigInt(userOp.maxFeePerGas)
  const originalPriorityFee = BigInt(userOp.maxPriorityFeePerGas)

  // Apply cap if network's maxFeePerGas would exceed budget
  if (originalMaxFee > maxFeePerGasCap) {
    // Cap maxFeePerGas
    userOp.maxFeePerGas = "0x" + maxFeePerGasCap.toString(16)

    // EIP-1559 constraint: maxPriorityFeePerGas must be <= maxFeePerGas
    // If priority fee is now higher than capped max fee, reduce it too
    let cappedPriorityFee = originalPriorityFee
    if (originalPriorityFee > maxFeePerGasCap) {
      cappedPriorityFee = maxFeePerGasCap
      userOp.maxPriorityFeePerGas = "0x" + maxFeePerGasCap.toString(16)
    }

    logFeeCapApplied({
      totalGas,
      originalMaxFee,
      originalPriorityFee,
      cappedMaxFee: maxFeePerGasCap,
      cappedPriorityFee,
      maxBudgetUSD: MAX_COST_USD,
      ethPrice: ETH_PRICE_USD
    })
  }
}
