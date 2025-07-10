import { Chain, http, webSocket } from "viem"
import { createWagmiConfig } from "@latticexyz/entrykit/internal"
import { baseSepolia, anvil } from "$lib/modules/entrykit/chainConfigs"

export const chains = [baseSepolia, anvil] as const satisfies Chain[]

export const transports = {
  [anvil.id]: webSocket(),
  [baseSepolia.id]: http()
} as const

export const wagmiConfig = (chainId: number) =>
  createWagmiConfig({
    chainId,
    walletConnectProjectId: "",
    appName: document.title,
    chains,
    transports,
    pollingInterval: {
      [anvil.id]: 500,
      [baseSepolia.id]: 2000
    }
  })
