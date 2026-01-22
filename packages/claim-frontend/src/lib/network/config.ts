/**
 * Network configuration for claim-frontend
 *
 * Simplified config - hardcoded to Base mainnet only.
 * Contract addresses come from environment variables.
 */

import { type Chain, type Hex } from "viem"
import { base } from "viem/chains"
import {
  PUBLIC_BASE_RPC_URL,
  PUBLIC_RAT_TOKEN_ADDRESS,
  PUBLIC_AIRDROP_CONTRACT_ADDRESS
} from "$env/static/public"

export type NetworkConfig = {
  chain: Chain
  chainId: number
  rpcUrl: string
  ratTokenAddress: Hex
  airdropContractAddress: Hex
}

/**
 * Chain configuration with custom RPC URL
 */
const chain: Chain = {
  ...base,
  rpcUrls: {
    default: {
      http: [PUBLIC_BASE_RPC_URL, ...base.rpcUrls.default.http]
    }
  }
}

/**
 * Get network configuration
 */
export function getNetworkConfig(): NetworkConfig {
  if (!PUBLIC_RAT_TOKEN_ADDRESS) {
    throw new Error("PUBLIC_RAT_TOKEN_ADDRESS environment variable is required")
  }
  if (!PUBLIC_AIRDROP_CONTRACT_ADDRESS) {
    throw new Error("PUBLIC_AIRDROP_CONTRACT_ADDRESS environment variable is required")
  }

  return {
    chain,
    chainId: base.id, // 8453
    rpcUrl: chain.rpcUrls.default.http[0],
    ratTokenAddress: PUBLIC_RAT_TOKEN_ADDRESS as Hex,
    airdropContractAddress: PUBLIC_AIRDROP_CONTRACT_ADDRESS as Hex
  }
}
