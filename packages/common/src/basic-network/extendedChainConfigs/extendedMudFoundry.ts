import { MUDChain, mudFoundry } from "@latticexyz/common/chains"

export const extendedMudFoundry = {
  ...mudFoundry,
  rpcUrls: {
    ...mudFoundry.rpcUrls
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
} as const satisfies MUDChain
