import { type Chain, http } from "viem"
import { base, baseSepolia, foundry } from "viem/chains"
import { CreateConnectorFn } from "@wagmi/core"
import { injected, safe } from "wagmi/connectors"
import { PUBLIC_BASE_RPC_URL, PUBLIC_BASE_SEPOLIA_RPC_URL } from "$env/static/public"

/**
 * Extended chain configs with custom RPC URLs
 */
const extendedBase = {
  ...base,
  rpcUrls: {
    default: {
      http: [PUBLIC_BASE_RPC_URL, ...base.rpcUrls.default.http]
    }
  }
} as const satisfies Chain

const extendedBaseSepolia = {
  ...baseSepolia,
  rpcUrls: {
    default: {
      http: [PUBLIC_BASE_SEPOLIA_RPC_URL, ...baseSepolia.rpcUrls.default.http]
    }
  }
} as const satisfies Chain

export const chains = [extendedBase, extendedBaseSepolia, foundry] as const satisfies Chain[]

export const transports = {
  [extendedBase.id]: http(),
  [extendedBaseSepolia.id]: http(),
  [foundry.id]: http()
} as const

/**
 * Get connectors based on environment
 * Simplified for claim-frontend - no WalletConnect complexity needed
 */
export function getConnectors(): CreateConnectorFn[] {
  const connectors: CreateConnectorFn[] = []

  // ALWAYS include injected connector for browser extensions and mobile wallet browsers
  connectors.push(injected())

  // Gnosis Safe connector for Safe apps (iframe context)
  if (typeof window !== "undefined" && window?.parent !== window) {
    connectors.push(
      safe({
        allowedDomains: [/gnosis-safe.io$/, /app.safe.global$/]
      })
    )
  }

  return connectors
}
