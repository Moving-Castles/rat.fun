import { baseSepolia as baseSepoliaConfig } from "viem/chains"
import { type MUDChain } from "@latticexyz/common/chains"

export const extendedBaseSepolia = {
  ...baseSepoliaConfig,
  rpcUrls: {
    default: {
      http: ["https://api.developer.coinbase.com/rpc/v1/base-sepolia/nwWmepet0KAHsp8awdicqYG1g8KkrGWo", ...baseSepoliaConfig.rpcUrls.default.http]
    },
    bundler: {
      http: ["https://api.developer.coinbase.com/rpc/v1/base-sepolia/nwWmepet0KAHsp8awdicqYG1g8KkrGWo"]
    }
  },
  indexerUrl: "https://base-sepolia.rat-fun-indexer.com"
} as const satisfies MUDChain
