import { base as baseConfig } from "viem/chains"
import { type MUDChain } from "@latticexyz/common/chains"
import { PUBLIC_BASE_RPC_URL, PUBLIC_BASE_BUNDLER_URL } from "$env/static/public"

export const extendedBase = {
  ...baseConfig,
  rpcUrls: {
    default: {
      http: [PUBLIC_BASE_RPC_URL, ...baseConfig.rpcUrls.default.http]
    },
    bundler: {
      http: [PUBLIC_BASE_BUNDLER_URL]
    }
  },
  indexerUrl: "https://base.rat-fun-indexer.com"
} as const satisfies MUDChain
