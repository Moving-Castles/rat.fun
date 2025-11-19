/*
 * The supported chains.
 *
 * - mudFoundry, the chain running on anvil that pnpm dev
 *   starts by default. It is similar to the viem anvil chain
 *   (see https://viem.sh/docs/clients/test.html), but with the
 *   basefee set to zero to avoid transaction fees.
 *
 */

import { MUDChain, mudFoundry } from "@latticexyz/common/chains"
import { extendedBase, extendedBaseSepolia } from "./extendedChainConfigs"

export const supportedChains = [
  // Deployment chains
  mudFoundry,
  extendedBase,
  extendedBaseSepolia,
] as const satisfies MUDChain[]
