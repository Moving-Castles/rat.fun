/*
 * Network specific configuration for the client.
 * By default connect to the anvil test network.
 */

/*
 * Import the addresses of the World, possibly on multiple chains,
 * from packages/contracts/worlds.json. When the contracts package
 * deploys a new `World`, it updates this file.
 */
import worlds from "contracts/worlds.json" with { type: "json" }
import { ChainNotFoundError, WorldAddressNotFoundError } from "@modules/error-handling/errors"

/*
 * The supported chains.
 */

import { supportedChains } from "./supportedChains"

export async function getNetworkConfig(chainId: number) {
  /*
   * Find the chain (unless it isn't in the list of supported chains).
   */
  const chainIndex = supportedChains.findIndex(c => c.id === chainId)
  const chain = supportedChains[chainIndex]
  if (!chain) {
    throw new ChainNotFoundError(chainId.toString())
  }

  /*
   * Get the address of the World. Environment variables can override
   * the address from worlds.json. The format is WORLD_ADDRESS.
   */
  const world = worlds[chain.id.toString() as keyof typeof worlds]
  const envWorldAddress = process.env.WORLD_ADDRESS
  const worldAddress = envWorldAddress || world?.address
  if (!worldAddress) {
    throw new WorldAddressNotFoundError(chainId.toString())
  }

  /*
   * MUD clients use events to synchronize the database, meaning
   * they need to look as far back as when the World was started.
   * The block number for the World start can be specified either
   * via environment variable (INITIAL_BLOCK), on the URL
   * (as initialBlockNumber) or in the worlds.json file. If none
   * are provided, it starts at the first block, zero.
   */
  const envInitialBlock = process.env.INITIAL_BLOCK
  const initialBlockNumber = envInitialBlock
    ? BigInt(envInitialBlock)
    : ((world as any)?.blockNumber ?? 0n)

  return {
    chainId,
    chain,
    worldAddress,
    initialBlockNumber
  }
}
