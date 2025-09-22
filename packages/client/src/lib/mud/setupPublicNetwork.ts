/*
 * The MUD client code is built on top of viem
 * (https://viem.sh/docs/getting-started.html).
 * This line imports the functions we need from it.
 */
import { createPublicClient, fallback, webSocket, http, Hex, ClientConfig } from "viem"
import { syncToRecs } from "@latticexyz/store-sync/recs"

import { getNetworkConfig } from "./getNetworkConfig"
import { world } from "./world"
import { transportObserver } from "@latticexyz/common"

import { ENVIRONMENT } from "./enums"

/*
 * Import our MUD config, which includes strong types for
 * our tables and other config options. We use this to generate
 * things like RECS components and get back strong types for them.
 *
 * See https://mud.dev/templates/typescript/contracts#mudconfigts
 * for the source of this information.
 */
import mudConfig from "contracts/mud.config"

export type SetupPublicNetworkResult = Awaited<ReturnType<typeof setupPublicNetwork>>

export async function setupPublicNetwork(environment: ENVIRONMENT) {
  const networkConfig = getNetworkConfig(environment)

  /*
   * Create a viem public (read only) client
   * (https://viem.sh/docs/clients/public.html)
   */
  const transports = []

  // Add WebSocket transport if WebSocket URL is available
  if (networkConfig.provider.wsRpcUrl) {
    if (import.meta.env.DEV) {
      // Skipping websockets url
    } else {
      transports.push(webSocket(networkConfig.provider.wsRpcUrl))
    }
  }

  // Always add HTTP transport as fallback
  transports.push(http(networkConfig.provider.jsonRpcUrl))

  const clientOptions = {
    chain: networkConfig.chain,
    transport: transportObserver(fallback(transports)),
    pollingInterval: 2000
  } as const satisfies ClientConfig

  const publicClient = createPublicClient(clientOptions)

  const resolvedConfig = {
    world,
    config: mudConfig,
    address: networkConfig.worldAddress as Hex,
    publicClient,
    startBlock: BigInt(networkConfig.initialBlockNumber),
    indexerUrl: networkConfig.indexerUrl
  }

  /*
   * Sync on-chain state into RECS and keeps our client in sync.
   * Uses the MUD indexer if available, otherwise falls back
   * to the viem publicClient to make RPC calls to fetch MUD
   * events from the chain.
   */
  const { components, latestBlock$, storedBlockLogs$, waitForTransaction } =
    await syncToRecs(resolvedConfig)

  // Allows us to to only listen to the game specific tables
  const tableKeys = [
    ...Object.keys(mudConfig.tables).map(key => key.split("__")[1]) // Strips everything before and including '__'
  ]

  return {
    config: networkConfig,
    worldAddress: networkConfig.worldAddress,
    world,
    components,
    publicClient,
    latestBlock$,
    storedBlockLogs$,
    waitForTransaction,
    tableKeys
  }
}
