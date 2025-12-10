import { CreateConnectorFn } from "@wagmi/core"
import { injected } from "wagmi/connectors"
import { farcasterMiniApp } from "@farcaster/miniapp-wagmi-connector"
import { sdk } from "@farcaster/miniapp-sdk"

/**
 * WALLET CONNECTION SCENARIOS
 *
 * Detection order (most specific first):
 *
 * ┌─────────────────────────────────────────────────────────────────────────────┐
 * │ SCENARIO 1: Warpcast (Farcaster native app)                                 │
 * ├─────────────────────────────────────────────────────────────────────────────┤
 * │ Detection:                                                                  │
 * │   - Referrer contains farcaster.xyz, warpcast.com, or far.quest             │
 * │   - window.ethereum has isFarcaster/isWarpcast flags                        │
 * │   - In iframe with Farcaster SDK provider available                         │
 * │                                                                             │
 * │ Connector: farcasterMiniApp()                                               │
 * └─────────────────────────────────────────────────────────────────────────────┘
 *
 * ┌─────────────────────────────────────────────────────────────────────────────┐
 * │ SCENARIO 2: Coinbase Mobile (Base App / Coinbase Wallet)                    │
 * ├─────────────────────────────────────────────────────────────────────────────┤
 * │ Detection:                                                                  │
 * │   - Mobile device                                                           │
 * │   - window.ethereum.isCoinbaseWallet = true                                 │
 * │                                                                             │
 * │ Connector: injected()                                                       │
 * │ Signing: Coinbase Smart Wallet - has issues with signTypedData              │
 * └─────────────────────────────────────────────────────────────────────────────┘
 *
 * ┌─────────────────────────────────────────────────────────────────────────────┐
 * │ SCENARIO 3: Mobile Wallet In-App Browsers                                   │
 * ├─────────────────────────────────────────────────────────────────────────────┤
 * │ Detection:                                                                  │
 * │   - Mobile device                                                           │
 * │   - window.ethereum injected by wallet's browser                            │
 * │   - isMetaMask, isRainbow, etc. (NOT isCoinbaseWallet)                      │
 * │                                                                             │
 * │ Connector: injected()                                                       │
 * └─────────────────────────────────────────────────────────────────────────────┘
 *
 * ┌─────────────────────────────────────────────────────────────────────────────┐
 * │ SCENARIO 4: Desktop Browser Extensions                                      │
 * ├─────────────────────────────────────────────────────────────────────────────┤
 * │ Detection:                                                                  │
 * │   - Desktop (not mobile)                                                    │
 * │   - window.ethereum injected by extension                                   │
 * │                                                                             │
 * │ Connector: injected()                                                       │
 * └─────────────────────────────────────────────────────────────────────────────┘
 *
 * ┌─────────────────────────────────────────────────────────────────────────────┐
 * │ SCENARIO 5: Mobile Browser Without Wallet                                   │
 * ├─────────────────────────────────────────────────────────────────────────────┤
 * │ Detection:                                                                  │
 * │   - Mobile device                                                           │
 * │   - NO window.ethereum (no wallet injected)                                 │
 * │                                                                             │
 * │ Connector: None - user must open in wallet app                              │
 * └─────────────────────────────────────────────────────────────────────────────┘
 *
 * ┌─────────────────────────────────────────────────────────────────────────────┐
 * │ SCENARIO 6: Desktop Without Wallet                                          │
 * ├─────────────────────────────────────────────────────────────────────────────┤
 * │ Detection:                                                                  │
 * │   - Desktop (not mobile)                                                    │
 * │   - NO window.ethereum                                                      │
 * │                                                                             │
 * │ Connector: injected() - may prompt user to install wallet                   │
 * └─────────────────────────────────────────────────────────────────────────────┘
 */

/**
 * Check if we're in a Warpcast/Farcaster native context
 *
 * IMPORTANT: We can NOT rely on:
 * - ReactNativeWebView: MetaMask mobile also sets this
 * - Farcaster SDK returning a provider: It returns one even in non-Farcaster apps
 *
 * We CAN rely on:
 * - Referrer containing farcaster.xyz, warpcast.com, far.quest
 * - window.ethereum having isFarcaster/isWarpcast flags
 * - Being in iframe (not RN) with Farcaster SDK provider
 */
function isWarpcastContext(): boolean {
  if (typeof window === "undefined") return false

  // Method 1: Check referrer for Farcaster domains (MOST RELIABLE)
  const referrer = document.referrer || ""
  if (
    referrer.includes("farcaster.xyz") ||
    referrer.includes("warpcast.com") ||
    referrer.includes("far.quest")
  ) {
    console.log("[isWarpcastContext] Detected via referrer:", referrer)
    return true
  }

  // Method 2: Check window.ethereum for Farcaster wallet indicators (RELIABLE)
  if (window.ethereum) {
    const eth = window.ethereum as any
    if (eth.isFarcaster === true || eth.isWarpcast === true || eth._isFarcasterWallet === true) {
      console.log("[isWarpcastContext] Detected via ethereum flags")
      return true
    }
  }

  // Method 3: Check Farcaster SDK BUT only if in iframe (not RN)
  // ReactNativeWebView is used by many wallets (MetaMask, etc), so not reliable
  // But iframe + SDK is more reliable
  const isInIframe = window.parent !== window
  if (isInIframe) {
    try {
      const provider = sdk?.wallet?.getEthereumProvider?.()
      if (provider !== undefined && provider !== null) {
        console.log("[isWarpcastContext] Detected via SDK in iframe")
        return true
      }
    } catch {
      // SDK not ready
    }
  }

  // Do NOT trust SDK alone in ReactNativeWebView - too many false positives
  console.log("[isWarpcastContext] Not detected as Warpcast")
  return false
}

/**
 * Check if we're in Base App or Coinbase Wallet
 */
function isCoinbaseContext(): boolean {
  if (typeof window === "undefined" || !window.ethereum) return false

  const eth = window.ethereum as any

  if (eth.isCoinbaseWallet === true) return true
  if (eth.providerMap?.has?.("CoinbaseWallet")) return true
  if (eth.providers?.some?.((p: any) => p.isCoinbaseWallet)) return true

  return false
}

/**
 * Determine the environment and return appropriate connectors
 */
export function getConnectors(): CreateConnectorFn[] {
  const connectors: CreateConnectorFn[] = []

  if (typeof window === "undefined") {
    return connectors
  }

  const isCoinbase = isCoinbaseContext()
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  )
  const hasInjectedWallet = typeof window.ethereum !== "undefined"

  // Check Warpcast first - it needs a special connector
  // Important: Check BEFORE isCoinbase because Warpcast detection excludes Coinbase
  const isWarpcast = !isCoinbase && isWarpcastContext()

  console.log("[getConnectors] Detection:", { isWarpcast, isCoinbase, isMobile, hasInjectedWallet })

  if (isWarpcast) {
    // SCENARIO 1: Warpcast - needs farcasterMiniApp connector
    console.log("[getConnectors] Detected: Warpcast")
    connectors.push(farcasterMiniApp())
  } else if (hasInjectedWallet) {
    // SCENARIOS 2-5: Any environment with injected wallet
    if (isCoinbase && isMobile) {
      console.log("[getConnectors] Detected: Coinbase mobile (Base App)")
    } else if (isMobile) {
      console.log("[getConnectors] Detected: Mobile wallet browser")
    } else {
      console.log("[getConnectors] Detected: Desktop browser extension")
    }
    connectors.push(injected())
  } else if (isMobile) {
    // SCENARIO 6: Mobile browser without wallet - not supported
    console.log("[getConnectors] Detected: Mobile browser without wallet (not supported)")
  } else {
    // Desktop without wallet - try injected anyway (might prompt to install)
    console.log("[getConnectors] Detected: No wallet detected")
    connectors.push(injected())
  }

  return connectors
}
