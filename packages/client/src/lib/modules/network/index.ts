import { writable } from "svelte/store"
import { SetupPublicNetworkResult } from "$lib/mud/setupPublicNetwork"
import { SetupWalletNetworkResult } from "$lib/mud/setupWalletNetwork"
import { ENVIRONMENT, WALLET_TYPE, SALE_STATUS } from "$lib/mud/enums"

// ----------------------------------------------------------------------------

export { initBlockListener } from "./blockListener"

// --- STORES -----------------------------------------------------------------

export const publicNetwork = writable({} as SetupPublicNetworkResult)
export const walletNetwork = writable({} as SetupWalletNetworkResult)
export const blockNumber = writable(BigInt(0))
export const ready = writable(false)
export const loadingMessage = writable("Loading started")
export const loadingPercentage = writable(0)

export const environment = writable<ENVIRONMENT>(ENVIRONMENT.UNKNOWN)
export const walletType = writable<WALLET_TYPE>(WALLET_TYPE.UNKNOWN)
export const saleStatus = writable<SALE_STATUS>(SALE_STATUS.UNKNOWN)

// ----------------------------------------------------------------------------
/**
 * Get the chain/environment the client is accessing from the URL
 * Should only be called once per session.
 * @param url - The URL the client is accessed on
 * @returns The chain/environment the client is accessing
 */
export const getEnvironmentFromUrl = (url: URL) => {
  const hostname = url.hostname
  const networkParam = url.searchParams.get("network")

  if (
    hostname === "rat.fun" ||
    hostname === "rat-fun-drawbridge.netlify.app" ||
    networkParam === "base"
  ) {
    return ENVIRONMENT.BASE
  } else if (hostname === "base-sepolia.rat.fun" || networkParam === "base-sepolia") {
    return ENVIRONMENT.BASE_SEPOLIA
  } else {
    return ENVIRONMENT.DEVELOPMENT
  }
}

/**
 * Get the wallet type the client is using from the URL
 * Should only be called once per session.
 * @param url - The URL the client is accessed on
 * @returns The wallet type the client is using
 */
export const getWalletTypeFromUrl = (_url: URL) => {
  // Only DRAWBRIDGE wallet type is supported
  return WALLET_TYPE.DRAWBRIDGE
}
