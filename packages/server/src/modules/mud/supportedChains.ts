/*
 * The supported chains.
 */

import { MUDChain, mudFoundry } from "@latticexyz/common/chains"
import { extendedBase, extendedBaseSepolia } from "./extendedChainConfigs"

/*
 * See https://mud.dev/guides/hello-world/add-chain-client
 * for instructions on how to add networks.
 */
export const supportedChains: MUDChain[] = [mudFoundry, extendedBase, extendedBaseSepolia]
