import { Chain, http } from "viem"
import { CreateConnectorFn } from "@wagmi/core"
import { injected, safe, walletConnect } from "wagmi/connectors"
import {
  extendedBase,
  extendedBaseSepolia,
  extendedMudFoundry
} from "$lib/mud/extendedChainConfigs"
import { PUBLIC_WALLET_CONNECT_PROJECT_ID } from "$env/static/public"

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
 * Supports all 4 scenarios:
 * 1. Desktop browser extensions (MetaMask, Rainbow, Brave Wallet, etc.)
 *    → injected() connector auto-detects installed extensions
 * 2. Mobile wallet in-app browsers (MetaMask mobile, Coinbase mobile, etc.)
 *    → injected() connector detects window.ethereum
 * 3. Normal mobile browsers (Safari, Chrome on mobile)
 *    → WalletConnect deep links to wallet apps (MetaMask, Rainbow, Phantom)
 * 4. Farcaster Mini App
 *    → injected() connector if wallet connected to Farcaster
 *
 * Plus: Gnosis Safe apps (iframe context)
 */
export function getConnectors(): CreateConnectorFn[] {
  const connectors: CreateConnectorFn[] = []

  // ALWAYS include injected connector - works for:
  // 1. Desktop browser extensions (MetaMask, Rainbow, etc.)
  // 2. Mobile wallet in-app browsers (MetaMask mobile, Coinbase mobile)
  //    - These wallets inject window.ethereum in their browser
  // 3. Farcaster Mini App (if user's wallet is connected)
  connectors.push(injected())

  // WalletConnect - ONLY on mobile devices when NO injected wallet detected (case #3)
  // This covers: Normal mobile browsers (Safari, Chrome) where user has wallet apps
  // but not in-app browser, so we need to deep link to their wallet app
  if (typeof window !== "undefined") {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    )
    const hasInjectedWallet = typeof window.ethereum !== "undefined"

    // Only add WalletConnect if on mobile AND no injected wallet
    if (isMobile && !hasInjectedWallet) {
      connectors.push(
        walletConnect({
          projectId: PUBLIC_WALLET_CONNECT_PROJECT_ID,
          metadata: {
            name: "RAT.FUN",
            description: "RAT IS FUN",
            url: "https://rat.fun",
            icons: ["https://rat.fun/images/favicon.png"]
          },
          showQrModal: true // Shows WalletConnect's built-in modal with wallet list
        })
      )
    }
  }

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
