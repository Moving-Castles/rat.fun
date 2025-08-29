import { writable, get } from "svelte/store"
import { browser } from "$app/environment"
import { SetupPublicNetworkResult } from "$lib/mud/setupPublicNetwork"
import { SetupWalletNetworkResult } from "$lib/mud/setupWalletNetwork"
import { ENVIRONMENT, WALLET_TYPE } from "$lib/mud/enums"
import { page } from "$app/state"

// ----------------------------------------------------------------------------

export { initBlockListener } from "./blockListener"

// --- STORES -----------------------------------------------------------------

export const publicNetwork = writable({} as SetupPublicNetworkResult)
export const walletNetwork = writable({} as SetupWalletNetworkResult)
export const blockNumber = writable(BigInt(0))
export const ready = writable(false)
export const loadingMessage = writable("Loading started")
export const loadingPercentage = writable(0)

// Persistent stores
export const environment = writable<ENVIRONMENT>() // important to be undefined first
export const walletType = writable<WALLET_TYPE>() // same

// ----------------------------------------------------------------------------

export const getEnvironmentFromUrl = (url: URL) => {
  const hostname = url.hostname

  if (hostname.includes("sepolia") || url.searchParams.has("sepolia")) {
    return ENVIRONMENT.BASE_SEPOLIA
  }

  if (hostname.includes("base") || url.searchParams.has("base")) {
    return ENVIRONMENT.BASE
  }

  return ENVIRONMENT.DEVELOPMENT
}

export const getEnvironment = (): ENVIRONMENT => {
  if (browser) {
    const storedEnvironment = get(environment)
    if (storedEnvironment) {
      console.log("resolved environment from store", storedEnvironment)
      return storedEnvironment
    }
  }

  const urlEnvironment = getEnvironmentFromUrl(page.url)
  environment.set(urlEnvironment)

  console.log("resolved environment from URL", urlEnvironment)
  return urlEnvironment
}

export const getWalletTypeFromUrl = (url: URL) => {
  const hostname = url.hostname

  if (
    hostname.includes("entrykit") ||
    url.searchParams.has("entrykit") ||
    hostname.includes("sepolia") || // wallet is always entrykit if we do sepolia
    url.searchParams.has("sepolia")
  ) {
    return WALLET_TYPE.ENTRYKIT
  }

  return WALLET_TYPE.BURNER
}

export const getWalletType = () => {
  if (browser) {
    const storedWalletType = get(walletType)
    if (storedWalletType) {
      console.log("resolved stored wallet type ", storedWalletType)
      return storedWalletType
    }
  }

  const urlWalletType = getWalletTypeFromUrl(page.url)
  console.log("resolved url wallet type ", urlWalletType)
  walletType.set(urlWalletType)
  return urlWalletType
}
