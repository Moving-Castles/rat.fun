import { Transport, Chain, Client, RpcSchema, EstimateFeesPerGasReturnType } from "viem"
import {
  BundlerClient,
  BundlerClientConfig,
  SmartAccount,
  PaymasterClient,
  createBundlerClient as viem_createBundlerClient
} from "viem/account-abstraction"
import { defaultClientConfig } from "../core/types"
import { getPaymaster } from "./getPaymaster"

/**
 * Create a bundler client for submitting ERC-4337 user operations
 *
 * A bundler client is a specialized viem client that:
 * - Submits user operations to the bundler RPC
 * - Handles gas estimation for user operations
 * - Integrates paymaster for gas sponsorship
 * - Manages smart account interactions
 *
 * This function wraps viem's createBundlerClient with:
 * - Automatic paymaster configuration from chain or override
 * - Custom fee estimation for Anvil (local dev)
 * - Default polling interval
 *
 * @param config Bundler client configuration
 * @returns Configured bundler client
 */
export function createBundlerClient<
  transport extends Transport,
  chain extends Chain = Chain,
  account extends SmartAccount = SmartAccount,
  client extends Client = Client,
  rpcSchema extends RpcSchema | undefined = undefined
>(
  config: BundlerClientConfig<transport, chain, account, client, rpcSchema>
): BundlerClient<transport, chain, account, client, rpcSchema> {
  const client = config.client
  if (!client) throw new Error("No `client` provided to `createBundlerClient`.")

  const chain = config.chain ?? client.chain
  const paymaster = chain
    ? getPaymaster(chain, config.paymaster as PaymasterClient | undefined)
    : undefined

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
    // Custom fee estimation for certain chains
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

  // All other chains - use viem's default fee estimation
  return undefined
}
