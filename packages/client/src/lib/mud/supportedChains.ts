/*
 * The supported chains.
 *
 * - mudFoundry, the chain running on anvil that pnpm dev
 *   starts by default. It is similar to the viem anvil chain
 *   (see https://viem.sh/docs/clients/test.html), but with the
 *   basefee set to zero to avoid transaction fees.
 *
 */
import {
  type MUDChain,
  mudFoundry,
  redstone,
} from "@latticexyz/common/chains";

import {
  arbitrum,
  arbitrumNova,
  arbitrumSepolia,
  base,
  baseSepolia,
  holesky,
  mainnet,
  optimism,
  optimismSepolia,
  sepolia,
} from "viem/chains";

import { pyrope } from "./pyropeChain";

const extendedRedstone = {
  ...redstone,
  faucetUrl: "https://redstone-faucet.onrender.com/trpc/drip",
  indexerUrl: "https://next-indexer.mud.redstonechain.com",
} as const satisfies MUDChain;

const extendedPyrope = {
  ...pyrope,
  faucetUrl: "https://pyrope-faucet.jimmy9-infra.com/trpc/drip",
} as const satisfies MUDChain;

export const supportedChains = [
  mudFoundry,
  mainnet,
  extendedRedstone,
  holesky,
  extendedPyrope,
  sepolia,
  optimism,
  optimismSepolia,
  base,
  baseSepolia,
  arbitrum,
  arbitrumNova,
  arbitrumSepolia,
] as const;
