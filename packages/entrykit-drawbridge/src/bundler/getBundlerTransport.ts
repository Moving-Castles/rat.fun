import { Chain, http } from "viem"

/**
 * Get bundler RPC transport for a chain
 *
 * Bundlers are special RPC endpoints that handle ERC-4337 user operations.
 * They submit user operations to the EntryPoint contract and handle gas sponsorship.
 *
 * The bundler URL must be configured in the chain's rpcUrls.bundler.http array.
 *
 * @param chain Chain configuration with bundler RPC URL
 * @returns HTTP transport for the bundler
 * @throws If chain doesn't have a bundler RPC URL configured
 */
export function getBundlerTransport(chain: Chain) {
  const bundlerHttpUrl = chain.rpcUrls.bundler?.http[0]

  if (bundlerHttpUrl) {
    return http(bundlerHttpUrl)
  }

  throw new Error(`Chain ${chain.id} config did not include a bundler RPC URL.`)
}
