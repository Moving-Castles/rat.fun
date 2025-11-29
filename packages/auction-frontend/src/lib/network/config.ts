/**
 * Network configuration for auction-frontend
 *
 * This replaces the complex MUD network config with a simple chain-based setup.
 * External addresses are read once from the World contract at startup.
 */

import { type Chain } from "viem"
import { base, baseSepolia } from "viem/chains"
import worldsJson from "contracts/worlds.json" with { type: "json" }
import { PUBLIC_BASE_RPC_URL, PUBLIC_BASE_SEPOLIA_RPC_URL } from "$env/static/public"

export enum ENVIRONMENT {
  UNKNOWN = "unknown",
  DEVELOPMENT = "development",
  BASE_SEPOLIA = "base-sepolia",
  BASE = "base"
}

export type NetworkConfig = {
  environment: ENVIRONMENT
  chain: Chain
  chainId: number
  rpcUrl: string
  worldAddress: `0x${string}`
}

/**
 * Chain configurations with custom RPC URLs
 */
const chainConfigs: Record<number, Chain> = {
  [base.id]: {
    ...base,
    rpcUrls: {
      default: {
        http: [PUBLIC_BASE_RPC_URL, ...base.rpcUrls.default.http]
      }
    }
  },
  [baseSepolia.id]: {
    ...baseSepolia,
    rpcUrls: {
      default: {
        http: [PUBLIC_BASE_SEPOLIA_RPC_URL, ...baseSepolia.rpcUrls.default.http]
      }
    }
  }
}

/**
 * World addresses from contracts deployment
 */
const worlds = worldsJson as Record<string, { address: string; blockNumber?: number }>

/**
 * Get network configuration based on environment
 */
export function getNetworkConfig(environment: ENVIRONMENT): NetworkConfig {
  let chainId: number

  switch (environment) {
    case ENVIRONMENT.BASE:
      chainId = base.id // 8453
      break
    case ENVIRONMENT.BASE_SEPOLIA:
      chainId = baseSepolia.id // 84532
      break
    default:
      chainId = 31337 // Local development
      break
  }

  const chain = chainConfigs[chainId]
  if (!chain) {
    throw new Error(`Unsupported chain ID: ${chainId}`)
  }

  const world = worlds[chainId.toString()]
  if (!world?.address) {
    throw new Error(`No world address found for chain ID: ${chainId}`)
  }

  return {
    environment,
    chain,
    chainId,
    rpcUrl: chain.rpcUrls.default.http[0],
    worldAddress: world.address as `0x${string}`
  }
}

/**
 * Get environment from URL hostname/params
 */
export function getEnvironmentFromUrl(url: URL): ENVIRONMENT {
  const hostname = url.hostname
  const networkParam = url.searchParams.get("network")

  if (hostname === "rat.fun" || networkParam === "base") {
    return ENVIRONMENT.BASE
  } else if (hostname === "base-sepolia.rat.fun" || networkParam === "base-sepolia") {
    return ENVIRONMENT.BASE_SEPOLIA
  } else {
    return ENVIRONMENT.DEVELOPMENT
  }
}
