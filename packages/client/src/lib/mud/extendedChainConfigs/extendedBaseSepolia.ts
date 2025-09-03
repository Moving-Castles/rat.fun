import { baseSepolia as baseSepoliaConfig } from "viem/chains"
import { type MUDChain } from "@latticexyz/common/chains"
import { PUBLIC_BASE_SEPOLIA_RPC_URL, PUBLIC_BASE_SEPOLIA_BUNDLER_URL } from "$env/static/public"

export const extendedBaseSepolia = {
  ...baseSepoliaConfig,
  rpcUrls: {
    default: {
      http: [PUBLIC_BASE_SEPOLIA_RPC_URL, ...baseSepoliaConfig.rpcUrls.default.http]
    },
    bundler: {
      http: [PUBLIC_BASE_SEPOLIA_BUNDLER_URL]
    }
  },
  indexerUrl: "https://base-sepolia.rat-fun-indexer.com"
} as const satisfies MUDChain
