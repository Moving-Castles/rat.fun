import { Chain, http } from "viem"
import { createWagmiConfig } from "@latticexyz/entrykit/internal"
import { extendedBaseSepolia } from "$lib/mud/extendedChainConfigs"

const extendedBaseSepoliaWithBundler = {
  ...extendedBaseSepolia,
  rpcUrls: {
    ...extendedBaseSepolia.rpcUrls,
    bundler: {
      http: ["https://public.pimlico.io/v2/84532/rpc"]
    }
  }
}

export const chains = [extendedBaseSepoliaWithBundler] as const satisfies Chain[]

export const transports = {
  [extendedBaseSepoliaWithBundler.id]: http()
} as const

export const wagmiConfig = (chainId: number) =>
  createWagmiConfig({
    chainId,
    walletConnectProjectId: "",
    appName: document.title,
    chains,
    transports,
    pollingInterval: {
      [extendedBaseSepoliaWithBundler.id]: 2000
    }
  })
