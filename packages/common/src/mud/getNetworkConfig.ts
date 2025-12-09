/*
 * Network specific configuration for the client.
 * By default connect to the anvil test network.
 *
 */

import { Hex } from "viem"
import { MUDChain } from "@latticexyz/common/chains"
import { ENVIRONMENT } from "../basic-network/enums"
import { WorldAddressNotFoundError } from "../error-handling/errors"
import { getWorldFromChainId } from "./utils"
import { ChainRpcUrls, getBasicNetworkConfig } from "../basic-network"

export interface NetworkConfig {
  provider: {
    chainId: number
    jsonRpcUrl: string
    wsRpcUrl?: string
  }
  chainId: number
  faucetServiceUrl?: string | null
  worldAddress: Hex
  initialBlockNumber: number
  chain: MUDChain
  indexerUrl?: string
  fallbackIndexerUrl?: string
}

export interface IndexerUrlConfig {
  indexerUrl?: string
  fallbackIndexerUrl?: string
}

export function getNetworkConfig(
  environment: ENVIRONMENT,
  url: URL,
  overrideDefaultRpcUrls: ChainRpcUrls | null = null,
  overrideIndexerUrls: IndexerUrlConfig | null = null
): NetworkConfig {
  // Use provided URL or fallback to empty search params for SSR
  const searchParams = url?.searchParams

  // URL RPC override takes precedence
  const searchParamsRpc = searchParams?.get("rpc")
  if (searchParamsRpc) {
    overrideDefaultRpcUrls = {
      http: [searchParamsRpc]
    }
  }

  const { chainId, chain } = getBasicNetworkConfig(environment, overrideDefaultRpcUrls)

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

  // Use override indexer URLs if provided, otherwise use chain defaults
  let indexerUrl = overrideIndexerUrls?.indexerUrl ?? chain.indexerUrl
  let fallbackIndexerUrl = overrideIndexerUrls?.fallbackIndexerUrl

  if (searchParams?.has("disableIndexer")) {
    indexerUrl = undefined
    fallbackIndexerUrl = undefined
  }

  return {
    provider: {
      chainId,
      jsonRpcUrl: searchParams?.get("rpc") ?? chain.rpcUrls.default.http[0],
      wsRpcUrl:
        searchParams?.get("wsRpc") ??
        ("webSocket" in chain.rpcUrls.default ? chain.rpcUrls.default.webSocket?.[0] : undefined)
    },
    chainId,
    faucetServiceUrl: searchParams?.get("faucet") ?? (chain as MUDChain).faucetUrl,
    worldAddress,
    initialBlockNumber,
    chain,
    indexerUrl,
    fallbackIndexerUrl
  }
}
