import { Chain, http } from "viem"
import { createWagmiConfig } from "@latticexyz/entrykit/internal"
import { extendedBaseSepolia, extendedMudFoundry } from "$lib/mud/extendedChainConfigs"

export const chains = [extendedMudFoundry, extendedBaseSepolia] as const satisfies Chain[]

export const transports = {
  [extendedBaseSepolia.id]: http(),
  [extendedMudFoundry.id]: http()
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
