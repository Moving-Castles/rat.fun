import { Transport, Chain, Client, RpcSchema, EstimateFeesPerGasReturnType } from "viem"
import { estimateFeesPerGas } from "viem/actions"
import {
  BundlerClient,
  BundlerClientConfig,
  SmartAccount,
  PaymasterClient,
  createBundlerClient as viem_createBundlerClient
} from "viem/account-abstraction"
import { defaultClientConfig } from "../types"
import { getPaymaster } from "./paymaster"
import { type GasEstimates } from "./gasEstimator"
import {
  logBundlerClientConfig,
  logFeeEstimationStart,
  logFeeEstimationResult,
  logFeeEstimationFallback
} from "./tempDebugLogging"

/**
 * Create a bundler client for submitting ERC-4337 user operations
 *
 * A bundler client is a specialized viem client that:
 * - Submits user operations to the bundler RPC
 * - Handles gas estimation for user operations (via transport wrapper)
 * - Integrates paymaster for gas sponsorship
 * - Manages smart account interactions
 *
 * This function wraps viem's createBundlerClient with:
 * - Automatic paymaster configuration from chain or override
 * - Custom fee estimation for specific chains
 * - Default polling interval
 *
 * Gas estimation is handled by the transport layer (see gasEstimator.ts).
 *
 * @param config Bundler client configuration
 * @param gasEstimates Optional custom gas estimates for specific functions
 * @returns Configured bundler client
 */
export function createBundlerClient<
  transport extends Transport,
  chain extends Chain = Chain,
  account extends SmartAccount = SmartAccount,
  client extends Client = Client,
  rpcSchema extends RpcSchema | undefined = undefined
>(
  config: BundlerClientConfig<transport, chain, account, client, rpcSchema>,
  gasEstimates?: GasEstimates
): BundlerClient<transport, chain, account, client, rpcSchema> {
  const client = config.client
  if (!client) throw new Error("No `client` provided to `createBundlerClient`.")

  const chain = config.chain ?? client.chain
  const paymaster = chain
    ? getPaymaster(chain, config.paymaster as PaymasterClient | undefined)
    : undefined

  if (paymaster) {
    console.log(
      `[Drawbridge/BundlerClient] Bundler client configured with ${paymaster.type} paymaster`
    )
  } else {
    console.log(`[Drawbridge/BundlerClient] Bundler client configured without paymaster`)
  }

  logBundlerClientConfig({
    pollingInterval: defaultClientConfig.pollingInterval,
    hasPaymaster: !!paymaster,
    paymasterType: paymaster?.type
  })

  return viem_createBundlerClient({
    ...defaultClientConfig,
    // Configure paymaster for gas sponsorship
    paymaster: paymaster
      ? paymaster.type === "custom"
        ? paymaster.paymasterClient // Use custom paymaster client (e.g., Coinbase)
        : {
            // Simple paymaster - just return address with empty data
            getPaymasterData: async () => ({
              paymaster: paymaster.address,
              paymasterData: "0x"
            })
          }
      : undefined,
    // Custom fee estimation for specific chains
    userOperation: {
      estimateFeesPerGas: createFeeEstimator(client)
    },
    ...config
  })
}

/**
 * Create custom fee estimator for specific chains
 *
 * Some chains need special handling for fee estimation:
 *
 * - **Anvil (31337)**: Hardcoded fees because Anvil's eth_maxPriorityFeePerGas
 *   returns a fixed value that doesn't match real chains
 *
 * - **Base (8453) & Base Sepolia (84532)**: Enforce minimum maxPriorityFeePerGas
 *   of 1 gwei (1,000,000 wei) as required by Coinbase bundler
 *
 * - **Other chains**: Use viem's default fee estimation (works well)
 *
 * @param client Viem client
 * @returns Fee estimator function or undefined for default behavior
 */
function createFeeEstimator(
  client: Client
): undefined | (() => Promise<EstimateFeesPerGasReturnType<"eip1559">>) {
  if (!client.chain) return

  // Anvil (local development) - use fixed fees
  // See: https://github.com/foundry-rs/foundry/pull/8081#issuecomment-2402002485
  if (client.chain.id === 31337) {
    return async () => ({ maxFeePerGas: 100_000n, maxPriorityFeePerGas: 0n })
  }

  // Base chains (8453 = Base, 84532 = Base Sepolia)
  // Coinbase bundler requires minimum maxPriorityFeePerGas of 1 gwei
  if (client.chain.id === 8453 || client.chain.id === 84532) {
    return async () => {
      logFeeEstimationStart()
      try {
        const fees = await estimateFeesPerGas(client)
        const minPriorityFee = 1_000_000n // 0.001 gwei minimum (Coinbase requirement)
        const maxTotalFee = 500_000_000n // 0.5 gwei max to keep under $1 paymaster limit

        // Cap maxFeePerGas to prevent exceeding paymaster budget during gas spikes
        const cappedMaxFee = fees.maxFeePerGas > maxTotalFee ? maxTotalFee : fees.maxFeePerGas

        const result = {
          maxFeePerGas: cappedMaxFee,
          maxPriorityFeePerGas:
            fees.maxPriorityFeePerGas > minPriorityFee ? fees.maxPriorityFeePerGas : minPriorityFee
        }

        logFeeEstimationResult({
          networkMaxFee: fees.maxFeePerGas,
          cappedMaxFee: result.maxFeePerGas,
          maxPriorityFeePerGas: result.maxPriorityFeePerGas,
          maxTotalFee
        })

        return result
      } catch (error) {
        // If eth_maxPriorityFeePerGas is not supported by the RPC provider, use safe defaults
        // This can happen with some wallet providers or RPC endpoints
        logFeeEstimationFallback(error)
        return {
          maxFeePerGas: 1_000_000_000n, // 1 gwei (1 billion wei)
          maxPriorityFeePerGas: 100_000_000n // 0.1 gwei minimum (100 million wei) - Higher to ensure bundler processes it
        }
      }
    }
  }

  // All other chains - use viem's default fee estimation
  return undefined
}
