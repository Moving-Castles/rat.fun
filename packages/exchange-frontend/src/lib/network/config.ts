/**
 * Network configuration for exchange-frontend
 *
 * Base mainnet only - addresses from environment variables.
 */

import { type Chain, type Hex } from "viem"
import { base } from "viem/chains"
import {
  PUBLIC_BASE_RPC_URL,
  PUBLIC_FAKE_RAT_TOKEN_ADDRESS,
  PUBLIC_RAT_TOKEN_ADDRESS,
  PUBLIC_EXCHANGE_CONTRACT_ADDRESS
} from "$env/static/public"

export type NetworkConfig = {
  chain: Chain
  chainId: number
  rpcUrl: string
  fakeRatTokenAddress: Hex
  ratTokenAddress: Hex
  exchangeContractAddress: Hex
}

/**
 * Chain configuration with custom RPC URL
 */
const chainConfig: Chain = {
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
    chain: chainConfig,
    chainId: base.id,
    rpcUrl: chainConfig.rpcUrls.default.http[0],
    fakeRatTokenAddress: PUBLIC_FAKE_RAT_TOKEN_ADDRESS as Hex,
    ratTokenAddress: PUBLIC_RAT_TOKEN_ADDRESS as Hex,
    exchangeContractAddress: PUBLIC_EXCHANGE_CONTRACT_ADDRESS as Hex
  }
}
