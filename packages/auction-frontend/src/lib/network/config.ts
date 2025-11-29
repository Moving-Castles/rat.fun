/**
 * Network configuration for auction-frontend
 *
 * Base mainnet only. RAT token address from environment variable.
 */

import { type Chain, type Hex } from "viem"
import { base } from "viem/chains"
import { PUBLIC_BASE_RPC_URL, PUBLIC_RAT_TOKEN_ADDRESS } from "$env/static/public"

export type NetworkConfig = {
  chain: Chain
  chainId: number
  rpcUrl: string
  ratTokenAddress: Hex
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
    rpcUrl: baseChain.rpcUrls.default.http[0],
    ratTokenAddress: PUBLIC_RAT_TOKEN_ADDRESS as Hex
  }
}
