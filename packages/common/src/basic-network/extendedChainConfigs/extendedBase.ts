import { base as baseConfig } from "viem/chains"
import { type MUDChain } from "@latticexyz/common/chains"

export const extendedBase = {
  ...baseConfig,
  rpcUrls: {
    default: {
      http: ["https://api.developer.coinbase.com/rpc/v1/base/nwWmepet0KAHsp8awdicqYG1g8KkrGWo", ...baseConfig.rpcUrls.default.http]
    },
    bundler: {
      http: ["https://api.developer.coinbase.com/rpc/v1/base/nwWmepet0KAHsp8awdicqYG1g8KkrGWo"]
    }
  },
  indexerUrl: "https://base.rat-fun-indexer.com"
} as const satisfies MUDChain
