import { Chain, http } from "viem"
import { createWagmiConfig } from "@latticexyz/entrykit/internal"
import { extendedBaseSepolia } from "$lib/mud/extendedChainConfigs"

export const chains = [extendedBaseSepolia] as const satisfies Chain[]

export const transports = {
  [extendedBaseSepolia.id]: http(extendedBaseSepolia.rpcUrls.default.http[0]) // this is annoying. But needed
} as const

export const wagmiConfig = (chainId: number) =>
  createWagmiConfig({
    chainId,
    walletConnectProjectId: "",
    appName: document.title,
    chains,
    transports,
    pollingInterval: {
      [extendedBaseSepolia.id]: 2000
    }
  })
