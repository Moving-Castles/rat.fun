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

// Debug state for visible debugging (no console in mobile browsers)
export const debugInfo = {
  userAgent: "",
  hasWindowEthereum: false,
  windowEthereumProviders: [] as string[],
  isMobile: false,
  isInIframe: false,
  connectorsCount: 0,
  timestamp: "",
  isBaseApp: false,
  isCoinbaseWallet: false
}

/**
 * Get connectors based on environment
 *
 * Supports all 4 scenarios:
 * 1. Desktop browser extensions (MetaMask, Rainbow, Brave Wallet, etc.)
 *    → injected() connector auto-detects installed extensions
 * 2. Mobile wallet in-app browsers (MetaMask mobile, Coinbase mobile, etc.)
 *    → injected() connector detects window.ethereum
 * 3. Normal mobile browsers (Safari, Chrome on mobile)
 *    → ??? (WalletConnect deep links to wallet apps (MetaMask, Rainbow, Phantom) should work but does not)
 * 4. Farcaster Mini App
 *    → injected() connector if wallet connected to Farcaster
 *
 * Plus: Gnosis Safe apps (iframe context)
 */
export function getConnectors(): CreateConnectorFn[] {
  const connectors: CreateConnectorFn[] = []

  // Collect debug info
  if (typeof window !== "undefined") {
    debugInfo.userAgent = navigator.userAgent
    debugInfo.hasWindowEthereum = typeof window.ethereum !== "undefined"
    debugInfo.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    )
    debugInfo.isInIframe = window?.parent !== window
    debugInfo.timestamp = new Date().toISOString()

    // Detect Base app / Coinbase Wallet
    // Multiple detection methods to catch all cases:
    if (window.ethereum) {
      const eth = window.ethereum as any

      // Method 1: Check isCoinbaseWallet flag
      const hasCoinbaseFlag = eth.isCoinbaseWallet === true

      // Method 2: Check for Coinbase-specific properties
      const hasCoinbaseProvider =
        eth.providerMap?.has?.("CoinbaseWallet") ||
        eth.providers?.some?.((p: any) => p.isCoinbaseWallet)

      // Method 3: Check if ONLY provider and has smart wallet capabilities
      const isOnlyProvider = !eth.isMetaMask && !eth.isRabby && !eth.isPhantom && !eth.isBraveWallet
      const hasSmartWalletFeatures = typeof eth.request === "function"

      debugInfo.isCoinbaseWallet = hasCoinbaseFlag || hasCoinbaseProvider
      debugInfo.isBaseApp = debugInfo.isCoinbaseWallet && debugInfo.isMobile

      // Check for provider info
      const providers: string[] = []
      if (eth.isCoinbaseWallet) providers.push("Coinbase")
      if (eth.isMetaMask) providers.push("MetaMask")
      if (eth.isRabby) providers.push("Rabby")
      if (eth.isPhantom) providers.push("Phantom")
      if (eth.isBraveWallet) providers.push("Brave")
      if (eth.providers) {
        providers.push(`Multiple providers (${eth.providers.length})`)
      }
      if (providers.length === 0) {
        providers.push("Unknown provider")
      }
      debugInfo.windowEthereumProviders = providers

      console.log("[wagmiConfig] Wallet detection:", {
        isCoinbaseWallet: debugInfo.isCoinbaseWallet,
        isBaseApp: debugInfo.isBaseApp,
        hasCoinbaseFlag,
        hasCoinbaseProvider,
        isOnlyProvider,
        hasSmartWalletFeatures,
        providers
      })
    }
  }

  // ALWAYS include injected connector - works for:
  // 1. Desktop browser extensions (MetaMask, Rainbow, etc.)
  // 2. Mobile wallet in-app browsers (MetaMask mobile, Coinbase mobile)
  //    - These wallets inject window.ethereum in their browser
  // 3. Farcaster Mini App (if user's wallet is connected)
  connectors.push(injected())

  // This is where we ideally should handle case #3 (normal mobile browsers)
  // WalletConnect is problematic, but might be the only option
  if (typeof window !== "undefined") {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    )
    const hasInjectedWallet = typeof window.ethereum !== "undefined"

    if (isMobile && !hasInjectedWallet) {
      // Either solve this or inform the user it is not supported
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

  debugInfo.connectorsCount = connectors.length

  return connectors
}
