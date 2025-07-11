import { baseSepolia as baseSepoliaConfig } from "viem/chains"
import { type MUDChain } from "@latticexyz/common/chains"

export const extendedBaseSepolia = {
  ...baseSepoliaConfig,
  rpcUrls: {
    ...baseSepoliaConfig.rpcUrls,
    bundler: {
      http: ["https://public.pimlico.io/v2/84532/rpc"]
    }
  },
  indexerUrl: "https://base-sepolia.rat-fun-indexer.com",
  faucetUrl: "https://pyrope-faucet.jimmy9-infra.com/trpc/drip"
} as const satisfies MUDChain

console.log("Extended config", extendedBaseSepolia)
