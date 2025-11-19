import { MUDChain } from "@latticexyz/common/chains"
import { supportedChains } from "./supportedChains"

export const getChain = (chainId: number): MUDChain => {
  const chainIndex = supportedChains.findIndex(c => c.id === chainId)
  const chain = supportedChains[chainIndex]

  if (!chain) {
    throw new Error(`Chain ${chainId} not supported`)
  }

  return chain
}
