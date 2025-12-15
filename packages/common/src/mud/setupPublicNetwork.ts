/*
 * The MUD client code is built on top of viem
 * (https://viem.sh/docs/getting-started.html).
 * This line imports the functions we need from it.
 */
import { Hex, PublicClient, Transport, Chain, Block } from "viem"
import { Observable } from "rxjs"
import { StorageAdapterBlock } from "@latticexyz/store-sync"
import { syncToRecs, SyncToRecsResult } from "@latticexyz/store-sync/recs"
import { getSnapshot } from "@latticexyz/store-sync/internal"
import { World } from "@latticexyz/recs"

import { setupPublicBasicNetwork } from "../basic-network"
import { NetworkConfig } from "./getNetworkConfig"
import { world } from "./world"

/*
 * Import our MUD config, which includes strong types for
 * our tables and other config options. We use this to generate
 * things like RECS components and get back strong types for them.
 *
 * See https://mud.dev/templates/typescript/contracts#mudconfigts
 * for the source of this information.
 */
import mudConfig from "contracts/mud.config"

type recsSyncResult = SyncToRecsResult<typeof mudConfig, {}>

/**
 * Attempts to sync using the primary indexer URL, then falls back to the
 * fallback indexer URL if provided, and finally falls back to RPC sync.
 */
async function syncWithFallback(
  baseConfig: {
    world: World
    config: typeof mudConfig
    address: Hex
    publicClient: PublicClient<Transport, Chain>
    startBlock: bigint
  },
  primaryIndexerUrl?: string,
  fallbackIndexerUrl?: string,
  playerId?: Hex
): Promise<recsSyncResult> {
  console.log('111')
  const { initialBlockLogs } = await getSnapshot({
    indexerUrl: "http://127.0.0.1:3001",
    storeAddress: baseConfig.address,
    filters: playerId ? [{ table: mudConfig.tables.ratfun__Name, key0: playerId }] : undefined,
    chainId: baseConfig.publicClient.chain.id
  })

  const a = await syncToRecs({
    ...baseConfig,
    indexerUrl: false,
    initialBlockLogs,
    startBlock: initialBlockLogs.blockNumber
  })
  console.log('222')
  return a
  // Try primary indexer if available
  if (primaryIndexerUrl) {
    try {
      console.log("[Chain Sync] Attempting sync with primary indexer:", primaryIndexerUrl)
      return await syncToRecs({ ...baseConfig, indexerUrl: primaryIndexerUrl })
    } catch (error) {
      console.warn("[Chain Sync] Primary indexer failed:", error)
    }
  }

  // Try fallback indexer if available
  if (fallbackIndexerUrl) {
    try {
      console.log("[Chain Sync] Attempting sync with fallback indexer:", fallbackIndexerUrl)
      return await syncToRecs({ ...baseConfig, indexerUrl: fallbackIndexerUrl })
    } catch (error) {
      console.warn("[Chain Sync] Fallback indexer failed:", error)
    }
  }

  // Fall back to RPC sync (no indexer URL)
  console.log("[Chain Sync] Falling back to RPC sync")
  return await syncToRecs({ ...baseConfig, indexerUrl: undefined })
}

export type SetupPublicNetworkResult = {
  config: NetworkConfig
  transport: Transport
  worldAddress: Hex
  world: World
  components: recsSyncResult["components"]
  publicClient: PublicClient<Transport, Chain>
  latestBlock$: Observable<Block>
  storedBlockLogs$: Observable<StorageAdapterBlock>
  waitForTransaction: recsSyncResult["waitForTransaction"]
  tableKeys: string[]
}

/**
 * Optional initial block logs for skipping indexer hydration.
 * When provided, MUD will skip fetching from indexer and start live sync from this block.
 */
export type InitialBlockLogs = {
  blockNumber: bigint
  logs: readonly []
}

export async function setupPublicNetwork(
  networkConfig: NetworkConfig,
  devMode: boolean,
  publicClient?: PublicClient<Transport, Chain>,
  initialBlockLogs?: InitialBlockLogs,
  playerId?: Hex
): Promise<SetupPublicNetworkResult> {
  const basicNetwork = await setupPublicBasicNetwork(networkConfig, devMode)
  publicClient ??= basicNetwork.publicClient

  const baseConfig = {
    world,
    config: mudConfig,
    address: networkConfig.worldAddress as Hex,
    publicClient,
    startBlock: BigInt(networkConfig.initialBlockNumber)
  }

  /*
   * Sync on-chain state into RECS and keeps our client in sync.
   * Uses the MUD indexer if available, otherwise falls back
   * to the viem publicClient to make RPC calls to fetch MUD
   * events from the chain.
   *
   * If initialBlockLogs is provided, skip indexer hydration and start
   * live sync from that block (used for server-side hydration).
   */
  let syncResult: recsSyncResult

  if (initialBlockLogs) {
    // Skip indexer - use server-provided data instead
    console.log(
      "[Chain Sync] Skipping indexer, using server hydration from block:",
      initialBlockLogs.blockNumber.toString()
    )
    syncResult = await syncToRecs({
      ...baseConfig,
      initialBlockLogs,
      indexerUrl: undefined
    })
  } else {
    // Normal flow: try indexers with fallback
    syncResult = await syncWithFallback(
      baseConfig,
      networkConfig.indexerUrl,
      networkConfig.fallbackIndexerUrl,
      playerId
    )
  }

  const { components, latestBlock$, storedBlockLogs$, waitForTransaction } = syncResult

  // Allows us to to only listen to the game specific tables
  const tableKeys = [
    ...Object.keys(mudConfig.tables).map(key => key.split("__")[1]) // Strips everything before and including '__'
  ]

  return {
    config: networkConfig,
    transport: basicNetwork.transport,
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
