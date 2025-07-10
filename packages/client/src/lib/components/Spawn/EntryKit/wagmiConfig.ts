import { Chain, http, webSocket } from "viem"
import { createWagmiConfig } from "@latticexyz/entrykit/internal"
import { garnet, pyrope, redstone } from "@latticexyz/common/chains"
import { baseSepolia, anvil } from "$lib/modules/entrykit/chainConfigs"

export const chains = [
  // redstone,
  // garnet,
  // pyrope,
  // baseSepolia,
  anvil
] as const satisfies Chain[]

export const transports = {
  [anvil.id]: webSocket()
  // [garnet.id]: http(),
  // [pyrope.id]: http(),
  // [redstone.id]: http(),
  // [baseSepolia.id]: http()
} as const

export const wagmiConfig = (chainId: number) =>
  createWagmiConfig({
    chainId,
    walletConnectProjectId: "",
    appName: document.title,
    chains,
    transports,
    pollingInterval: {
      [anvil.id]: 500
      // [garnet.id]: 2000,
      // [pyrope.id]: 2000,
      // [redstone.id]: 2000,
      // [baseSepolia.id]: 2000
    }
  })
