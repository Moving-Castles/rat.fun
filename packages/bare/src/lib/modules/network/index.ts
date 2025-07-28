import { writable } from "svelte/store"
import { SetupPublicNetworkResult } from "$lib/mud/setupPublicNetwork"
import { SetupWalletNetworkResult } from "$lib/mud/setupWalletNetwork"
import { ENVIRONMENT, WALLET_TYPE } from "$lib/mud/enums"

// ----------------------------------------------------------------------------

export { initBlockListener } from "./blockListener"

// --- STORES -----------------------------------------------------------------

export const publicNetwork = writable({} as SetupPublicNetworkResult)
export const walletNetwork = writable({} as SetupWalletNetworkResult)
export const blockNumber = writable(BigInt(0))
export const ready = writable(false)
export const loadingMessage = writable("Loading")
export const walletType = writable(WALLET_TYPE.BURNER as WALLET_TYPE)

// ----------------------------------------------------------------------------

export const getEnvironment = (url: URL) => {
  const hostname = url.hostname

  if (hostname.includes("sepolia") || url.searchParams.has("sepolia")) {
    return ENVIRONMENT.BASE_SEPOLIA
  }

  if (hostname.includes("base") || url.searchParams.has("base")) {
    return ENVIRONMENT.BASE
  }

  return ENVIRONMENT.DEVELOPMENT
}

export const getWalletType = (url: URL) => {
  const hostname = url.hostname

  if (hostname.includes("entrykit") || url.searchParams.has("entrykit")) {
    return WALLET_TYPE.ENTRYKIT
  }

  return WALLET_TYPE.BURNER
}
