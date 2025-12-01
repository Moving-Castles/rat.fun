import { Transport, Chain, Client, RpcSchema, EstimateFeesPerGasReturnType } from "viem"
import {
  BundlerClient,
  BundlerClientConfig,
  SmartAccount,
  PaymasterClient,
  createBundlerClient as viem_createBundlerClient
} from "viem/account-abstraction"
import { defaultClientConfig } from "../types"
import { getPaymaster } from "./paymaster"
import { logger } from "../logger"

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

  if (paymaster) {
    logger.log(
      `[Drawbridge/BundlerClient] Bundler client configured with ${paymaster.type} paymaster`
    )
  } else {
    logger.log(`[Drawbridge/BundlerClient] Bundler client configured without paymaster`)
  }

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
    ...config
  })
}
