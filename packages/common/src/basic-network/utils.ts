import { MUDChain } from "@latticexyz/common/chains"
import { ENVIRONMENT, WALLET_TYPE } from "./enums"
import { supportedChains } from "./supportedChains"

// Reexport the custom chain type
export type { MUDChain }

export const getChain = (chainId: number): MUDChain => {
  const chainIndex = supportedChains.findIndex(c => c.id === chainId)
  const chain = supportedChains[chainIndex]

  if (!chain) {
    throw new Error(`Chain ${chainId} not supported`)
  }

  return chain
}

/**
 * Get the chain/environment the client is accessing from the URL
 * Should only be called once per session.
 * @param url - The URL the client is accessed on
 * @returns The chain/environment the client is accessing
 */
export const getEnvironmentFromUrl = (url: URL) => {
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

/**
 * Get the wallet type the client is using from the URL
 * Should only be called once per session.
 * @param url - The URL the client is accessed on
 * @returns The wallet type the client is using
 */
export const getWalletTypeFromUrl = (url: URL) => {
  const hostname = url.hostname
  const walletTypeParam = url.searchParams.get("walletType")

  if (
    hostname === "rat.fun" ||
    hostname === "base-sepolia.rat.fun" ||
    walletTypeParam === "drawbridge"
  ) {
    return WALLET_TYPE.DRAWBRIDGE
  } else {
    return WALLET_TYPE.BURNER
  }
}
