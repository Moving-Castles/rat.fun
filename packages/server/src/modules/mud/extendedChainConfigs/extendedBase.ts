import { base as baseConfig } from "viem/chains"
import { type MUDChain } from "@latticexyz/common/chains"

const RPC_URL = process.env.RPC_URL

export const extendedBase = {
  ...baseConfig,
  rpcUrls: {
    default: {
      http: RPC_URL
        ? [RPC_URL, ...baseConfig.rpcUrls.default.http]
        : baseConfig.rpcUrls.default.http
    }
  }
} as const satisfies MUDChain
