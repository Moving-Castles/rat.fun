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
 *
 * Supports:
 * - Desktop browser extensions (MetaMask, Rainbow, Brave Wallet, etc.)
 * - Mobile wallet in-app browsers (MetaMask mobile, Coinbase Wallet mobile, etc.)
 * - Farcaster Mini App (uses injected provider)
 * - Gnosis Safe apps (iframe context)
 */
export function getConnectors(): CreateConnectorFn[] {
  const connectors: CreateConnectorFn[] = []

  // ALWAYS include injected connector - works for:
  // 1. Desktop browser extensions (MetaMask, Rainbow, etc.)
  // 2. Mobile wallet in-app browsers (MetaMask mobile, Coinbase mobile)
  //    - These wallets inject window.ethereum in their browser
  // 3. Farcaster Mini App (if user's wallet is connected)
  connectors.push(injected())

  // Gnosis Safe connector for Safe apps (iframe context)
  if (typeof window !== "undefined" && window?.parent !== window) {
    connectors.push(
      safe({
        allowedDomains: [/gnosis-safe.io$/, /app.safe.global$/]
      })
    )
  }

  // TODO: Add WalletConnect for normal mobile browsers (Safari, Chrome on mobile)
  // when ready to support case #3
  // connectors.push(
  //   walletConnect({
  //     projectId: PUBLIC_WALLET_CONNECT_PROJECT_ID,
  //     metadata: {
  //       name: "RAT.FUN",
  //       description: "On-chain dungeon crawler",
  //       url: "https://rat.fun",
  //       icons: ["https://rat.fun/images/favicon.png"]
  //     }
  //   })
  // )

  return connectors
}
