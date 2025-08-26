import { baseSepolia as baseSepoliaConfig } from "viem/chains"
import { type MUDChain } from "@latticexyz/common/chains"

export const extendedBaseSepolia = {
  ...baseSepoliaConfig,
  rpcUrls: {
    default: {
      http: ["https://api.developer.coinbase.com/rpc/v1/base-sepolia/3ewNiMtI6Vj7q6XobGjyWILDJNKFHkh1x"]
    },
    bundler: {
      http: ["https://api.developer.coinbase.com/rpc/v1/base-sepolia/3ewNiMtI6Vj7q6XobGjyWILDJNKFHkh1"]
    }
  },
  indexerUrl: "https://base-sepolia.rat-fun-indexer.com",
  faucetUrl: "https://pyrope-faucet.jimmy9-infra.com/trpc/drip"
} as const satisfies MUDChain
