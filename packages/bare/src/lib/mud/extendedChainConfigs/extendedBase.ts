import { base as baseConfig } from "viem/chains"
import { type MUDChain } from "@latticexyz/common/chains"

export const extendedBase = {
  ...baseConfig,
  indexerUrl: "https://base.rat-fun-indexer.com"
} as const satisfies MUDChain
