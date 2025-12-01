import { Chain, http, parseEther } from "viem"
import { logUserOperationCost, logFeeCapApplied } from "./logging"
import { logger } from "../logger"

/**
 * Retry configuration for rate limiting
 */
const RETRY_CONFIG = {
  maxRetries: 4, // Total of 5 attempts (1 initial + 4 retries)
  baseDelayMs: 1000, // Start with 1 second
  maxDelayMs: 16000 // Cap at 16 seconds
} as const

/**
 * Sleep utility for retry delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Calculate exponential backoff delay
 * @param attempt Retry attempt number (0-based)
 * @returns Delay in milliseconds
 */
function getRetryDelay(attempt: number): number {
  const delay = RETRY_CONFIG.baseDelayMs * Math.pow(2, attempt)
  return Math.min(delay, RETRY_CONFIG.maxDelayMs)
}

/**
 * Check if response contains a paymaster cost rejection
 */
async function isPaymasterCostRejection(response: Response): Promise<boolean> {
  if (response.status !== 200) return false

  try {
    const clonedResponse = response.clone()
    const body = await clonedResponse.json()

    // Check for Coinbase paymaster cost rejection
    // Error code -32002 with "max sponsorship cost" message
    if (body?.error?.code === -32002) {
      const details = body.error.details || body.error.message || ""
      return details.toLowerCase().includes("max sponsorship cost")
    }

    return false
  } catch {
    return false
  }
}

/**
 * Fetch with exponential backoff retry logic
 * Automatically retries on:
 * - 429 HTTP rate limit errors
 * - Network errors
 * - Paymaster cost rejections (RPC error -32002)
 */
async function fetchWithRetry(
  input: string | URL | Request,
  init?: RequestInit
): Promise<Response> {
  let lastError: Error | null = null

  for (let attempt = 0; attempt <= RETRY_CONFIG.maxRetries; attempt++) {
    try {
      const response = await fetch(input, init)

      // Check for HTTP rate limit error (429)
      if (response.status === 429) {
        const isLastAttempt = attempt === RETRY_CONFIG.maxRetries

        if (isLastAttempt) {
          let errorMessage = "Rate limit exceeded"
          try {
            const errorBody = await response.json()
            if (errorBody?.errorMessage) {
              errorMessage = errorBody.errorMessage
            }
          } catch {
            // Ignore JSON parse errors
          }

          throw new Error(
            `${errorMessage}. All ${RETRY_CONFIG.maxRetries + 1} retry attempts exhausted.`
          )
        }

        const delayMs = getRetryDelay(attempt)
        logger.warn(
          `[Drawbridge/Transport] Rate limit hit (429). Retrying in ${delayMs}ms (attempt ${attempt + 1}/${RETRY_CONFIG.maxRetries + 1})...`
        )

        await sleep(delayMs)
        continue
      }

      // Check for paymaster cost rejection (RPC error in response body)
      if (await isPaymasterCostRejection(response)) {
        const isLastAttempt = attempt === RETRY_CONFIG.maxRetries

        if (isLastAttempt) {
          // Don't throw - let the error propagate naturally
          // This allows the original error message to reach the user
          return response
        }

        const delayMs = getRetryDelay(attempt)
        logger.warn(
          `[Drawbridge/Transport] Paymaster cost limit exceeded. Retrying in ${delayMs}ms (attempt ${attempt + 1}/${RETRY_CONFIG.maxRetries + 1})...`
        )

        await sleep(delayMs)
        continue
      }

      // Success or non-retryable error
      return response
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))

      // If it's a network error on the last attempt, throw it
      if (attempt === RETRY_CONFIG.maxRetries) {
        throw lastError
      }

      // For network errors, also apply exponential backoff
      const delayMs = getRetryDelay(attempt)
      logger.warn(
        `[Drawbridge/Transport] Network error. Retrying in ${delayMs}ms (attempt ${attempt + 1}/${RETRY_CONFIG.maxRetries + 1})...`,
        error
      )
      await sleep(delayMs)
    }
  }

  // This should never be reached, but TypeScript needs it
  throw lastError || new Error("Unexpected error in fetchWithRetry")
}

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
      // Use custom fetch with retry logic
      fetchFn: fetchWithRetry,
      onFetchRequest: async request => {
        try {
          if (request.body) {
            const clonedRequest = request.clone()
            const text = await clonedRequest.text()
            const body = JSON.parse(text)

            // Apply fee cap to any method that includes a user operation
            // This includes both pm_getPaymasterData (paymaster call) and eth_sendUserOperation (actual send)
            // Fee capping MUST happen before paymaster sees the operation to stay under $1 limit
            if (
              body?.method === "pm_getPaymasterData" ||
              body?.method === "eth_sendUserOperation" ||
              body?.method === "eth_estimateUserOperationGas"
            ) {
              const userOp = body?.params?.[0]
              if (userOp && shouldApplyFeeCap) {
                applyFeeCap(userOp, ethPriceUSD)
              }

              // Log costs for send operations
              if (body?.method === "eth_sendUserOperation" && userOp) {
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

  // Track if we applied any caps for logging
  let maxFeeWasCapped = false
  let cappedMaxFee = originalMaxFee
  let cappedPriorityFee = originalPriorityFee

  // Apply cap if network's maxFeePerGas would exceed budget
  if (originalMaxFee > maxFeePerGasCap) {
    userOp.maxFeePerGas = "0x" + maxFeePerGasCap.toString(16)
    cappedMaxFee = maxFeePerGasCap
    maxFeeWasCapped = true
  }

  // ALWAYS enforce EIP-1559 constraint: maxPriorityFeePerGas must be <= maxFeePerGas
  // This must run independently of whether maxFee was capped above
  const currentMaxFee = BigInt(userOp.maxFeePerGas)
  if (originalPriorityFee > currentMaxFee) {
    userOp.maxPriorityFeePerGas = "0x" + currentMaxFee.toString(16)
    cappedPriorityFee = currentMaxFee
  }

  // Log if any capping was applied
  if (maxFeeWasCapped || cappedPriorityFee !== originalPriorityFee) {
    logFeeCapApplied({
      totalGas,
      originalMaxFee,
      originalPriorityFee,
      cappedMaxFee,
      cappedPriorityFee,
      maxBudgetUSD: MAX_COST_USD,
      ethPrice: ETH_PRICE_USD
    })
  }
}
