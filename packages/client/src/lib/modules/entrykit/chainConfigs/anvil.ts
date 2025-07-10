import { anvil as anvilConfig } from "viem/chains"

export const anvil = {
  ...anvilConfig,
  rpcUrls: {
    ...anvilConfig.rpcUrls,
    default: {
      http: ["https://anvil.tunnel.offchain.dev"],
      webSocket: ["wss://anvil.tunnel.offchain.dev"]
    }
  },
  contracts: {
    paymaster: {
      address: "0xf03E61E7421c43D9068Ca562882E98d1be0a6b6e"
    }
  },
  blockExplorers: {
    default: {} as never,
    worldsExplorer: {
      name: "MUD Worlds Explorer",
      url: "http://localhost:13690/anvil/worlds"
    }
  }
}
