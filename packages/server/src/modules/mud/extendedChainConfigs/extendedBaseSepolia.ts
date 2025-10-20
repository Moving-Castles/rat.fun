import { baseSepolia as baseSepoliaConfig } from "viem/chains"
import { type MUDChain } from "@latticexyz/common/chains"

const RPC_URL = process.env.RPC_URL

export const extendedBaseSepolia = {
  ...baseSepoliaConfig,
  rpcUrls: {
    default: {
      http: RPC_URL
        ? [RPC_URL, ...baseSepoliaConfig.rpcUrls.default.http]
        : baseSepoliaConfig.rpcUrls.default.http
    }
  }
} as const satisfies MUDChain
