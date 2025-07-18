/*
 * Network specific configuration for the client.
 * By default connect to the anvil test network.
 *
 */

import { getBurnerPrivateKey } from "@latticexyz/common"
import { getChain, getWorldFromChainId } from "./utils"
import { ENVIRONMENT } from "./enums"
import { MUDChain } from "@latticexyz/common/chains"

export function getNetworkConfig(environment: ENVIRONMENT) {
  const params = new URLSearchParams(window.location.search)

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

  const worldAddress = params.get("worldAddress") || world?.address
  if (!worldAddress) {
    throw new Error(`No world address found for chain ${chainId}. Did you run \`mud deploy\`?`)
  }

  /*
   * MUD clients use events to synchronize the database, meaning
   * they need to look as far back as when the World was started.
   * The block number for the World start can be specified either
   * on the URL (as initialBlockNumber) or in the worlds.json
   * file. If neither has it, it starts at the first block, zero.
   */
  const initialBlockNumber = params.has("initialBlockNumber")
    ? Number(params.get("initialBlockNumber"))
    : (world?.blockNumber ?? -1) // -1 will attempt to find the block number from RPC

  let indexerUrl = (chain as MUDChain).indexerUrl
  if (params.has("disableIndexer")) {
    indexerUrl = undefined
    console.log("Indexer disabled")
  }

  return {
    provider: {
      chainId,
      jsonRpcUrl: params.get("rpc") ?? chain.rpcUrls.default.http[0],
      wsRpcUrl:
        params.get("wsRpc") ??
        ("webSocket" in chain.rpcUrls.default ? chain.rpcUrls.default.webSocket?.[0] : undefined)
    },
    privateKey: params.get("privateKey") ?? getBurnerPrivateKey(),
    useBurner: params.has("useBurner"),
    chainId,
    faucetServiceUrl: params.get("faucet") ?? (chain as MUDChain).faucetUrl,
    worldAddress,
    initialBlockNumber,
    disableCache: import.meta.env.PROD,
    chain,
    indexerUrl
  }
}
