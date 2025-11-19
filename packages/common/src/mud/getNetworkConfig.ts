/*
 * Network specific configuration for the client.
 * By default connect to the anvil test network.
 *
 */

import { Hex } from "viem"
import { getBurnerPrivateKey } from "@latticexyz/common"
import { MUDChain } from "@latticexyz/common/chains"
import { ENVIRONMENT } from "../basic-network/enums"
import { WorldAddressNotFoundError } from "../error-handling/errors"
import { getWorldFromChainId } from "./utils"
import { getBasicNetworkConfig } from "../basic-network"

export function getNetworkConfig(environment: ENVIRONMENT, url: URL) {
  const { provider, chainId, chain } = getBasicNetworkConfig(environment, url)

  // Use provided URL or fallback to empty search params for SSR
  const searchParams = url?.searchParams

  /*
   * Get the address of the World. If you want to use a
   * different address than the one in worlds.json,
   * provide it as worldAddress in the query string.
   */
  const world = getWorldFromChainId(chain.id)

  const worldAddress = (searchParams?.get("worldAddress") || world?.address) as Hex
  if (!worldAddress) {
    throw new WorldAddressNotFoundError(chainId.toString())
  }

  /*
   * MUD clients use events to synchronize the database, meaning
   * they need to look as far back as when the World was started.
   * The block number for the World start can be specified either
   * on the URL (as initialBlockNumber) or in the worlds.json
   * file. If neither has it, it starts at the first block, zero.
   */
  const initialBlockNumber = searchParams?.has("initialBlockNumber")
    ? Number(searchParams.get("initialBlockNumber"))
    : (world?.blockNumber ?? -1) // -1 will attempt to find the block number from RPC

  let indexerUrl = (chain as MUDChain).indexerUrl
  if (searchParams?.has("disableIndexer")) {
    indexerUrl = undefined
  }

  // Only call getBurnerPrivateKey if we're in a browser environment
  const privateKey =
    searchParams?.get("privateKey") ??
    (typeof window !== "undefined" ? getBurnerPrivateKey() : null)

  return {
    provider,
    privateKey: searchParams?.get("privateKey") ?? privateKey, // do not run getBurnerPrivateKey in
    useBurner: searchParams?.has("useBurner"),
    chainId,
    faucetServiceUrl: searchParams?.get("faucet") ?? (chain as MUDChain).faucetUrl, // Todo, update
    worldAddress,
    initialBlockNumber,
    chain,
    indexerUrl
  }
}
