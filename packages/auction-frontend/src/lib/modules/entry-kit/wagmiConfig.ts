import { Chain, http } from "viem"
import { CreateConnectorFn } from "@wagmi/core"
import { injected, safe } from "wagmi/connectors"
import {
  extendedBase,
  extendedBaseSepolia,
  extendedMudFoundry
} from "$lib/mud/extendedChainConfigs"

export const chains = [
  extendedBase,
  extendedBaseSepolia,
  extendedMudFoundry
] as const satisfies Chain[]

export const transports = {
  [extendedBase.id]: http(),
  [extendedBaseSepolia.id]: http(),
  [extendedMudFoundry.id]: http()
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
