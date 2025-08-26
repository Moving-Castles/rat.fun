import { base as baseConfig } from "viem/chains"
import { type MUDChain } from "@latticexyz/common/chains"

export const extendedBase = {
  ...baseConfig,
  rpcUrls: {
    default: {
      http: ["https://api.developer.coinbase.com/rpc/v1/base/3ewNiMtI6Vj7q6XobGjyWILDJNKFHkh1"]
    },
    bundler: {
      http: ["https://api.developer.coinbase.com/rpc/v1/base/3ewNiMtI6Vj7q6XobGjyWILDJNKFHkh1"]
    }
  },
  indexerUrl: "https://base.rat-fun-indexer.com"
} as const satisfies MUDChain
