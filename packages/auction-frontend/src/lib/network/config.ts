/**
 * Network configuration for auction-frontend
 *
 * Base mainnet only.
 */

import { type Chain } from "viem"
import { base } from "viem/chains"
import { PUBLIC_BASE_RPC_URL } from "$env/static/public"

export type NetworkConfig = {
  chain: Chain
  chainId: number
  rpcUrl: string
}

/**
 * Base mainnet chain with custom RPC
 */
const baseChain: Chain = {
  ...base,
  rpcUrls: {
    default: {
      http: [PUBLIC_BASE_RPC_URL, ...base.rpcUrls.default.http]
    }
  }
}

/**
 * Get network configuration (Base mainnet only)
 */
export function getNetworkConfig(): NetworkConfig {
  return {
    chain: baseChain,
    chainId: base.id,
    rpcUrl: baseChain.rpcUrls.default.http[0]
  }
}
