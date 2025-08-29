/*
 * Network specific configuration for the client.
 * By default connect to the anvil test network.
 *
 */

import { getBurnerPrivateKey } from "@latticexyz/common"
import { getChain, getWorldFromChainId } from "./utils"
import { ENVIRONMENT } from "./enums"
import { MUDChain } from "@latticexyz/common/chains"
import { WorldAddressNotFoundError } from "$lib/modules/error-handling/errors"

export function getNetworkConfig(environment: ENVIRONMENT, url?: string | URL) {
  // Use provided URL or fallback to empty search params for SSR
  const searchParams = url
    ? new URLSearchParams(typeof url === "string" ? new URL(url).search : url.search)
    : new URLSearchParams()

  // Default to local development chain
  let chainId = 31337

  if ([ENVIRONMENT.BASE_SEPOLIA].includes(environment)) {
    chainId = 84532
  }

  if (environment === ENVIRONMENT.BASE) {
    chainId = 8453
  }

  const chain = getChain(chainId)

  /*
   * Get the address of the World. If you want to use a
   * different address than the one in worlds.json,
   * provide it as worldAddress in the query string.
   */
  const world = getWorldFromChainId(chain.id)

  const worldAddress = searchParams.get("worldAddress") || world?.address
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
  const initialBlockNumber = searchParams.has("initialBlockNumber")
    ? Number(searchParams.get("initialBlockNumber"))
    : (world?.blockNumber ?? -1) // -1 will attempt to find the block number from RPC

  let indexerUrl = (chain as MUDChain).indexerUrl
  if (searchParams.has("disableIndexer")) {
    indexerUrl = undefined
    console.log("Indexer disabled")
  }

  // Only call getBurnerPrivateKey if we're in a browser environment
  const privateKey =
    searchParams.get("privateKey") ?? (typeof window !== "undefined" ? getBurnerPrivateKey() : null)

  return {
    provider: {
      chainId,
      jsonRpcUrl: searchParams.get("rpc") ?? chain.rpcUrls.default.http[0],
      wsRpcUrl:
        searchParams.get("wsRpc") ??
        ("webSocket" in chain.rpcUrls.default ? chain.rpcUrls.default.webSocket?.[0] : undefined)
    },
    privateKey: searchParams.get("privateKey") ?? privateKey, // do not run getBurnerPrivateKey in
    useBurner: searchParams.has("useBurner"),
    chainId,
    faucetServiceUrl: searchParams.get("faucet") ?? (chain as MUDChain).faucetUrl,
    worldAddress,
    initialBlockNumber,
    disableCache: import.meta.env.PROD,
    chain,
    indexerUrl
  }
}
