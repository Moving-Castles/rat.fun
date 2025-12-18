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
async function getSnapshotWithFallback(
  baseConfig: {
    storeAddress: Hex
    chainId: number
    startBlock: bigint
  },
  primaryIndexerUrl?: string,
  fallbackIndexerUrl?: string,
  defaultChainIndexerUrl?: string
): Promise<StorageAdapterBlock | undefined> {
  // Try primary indexer if available
  if (primaryIndexerUrl) {
    try {
      console.log(
        "[Chain Sync] Attempting to get snapshot with primary indexer:",
        primaryIndexerUrl
      )
      const { initialBlockLogs } = await getSnapshot({
        ...baseConfig,
        indexerUrl: primaryIndexerUrl
      })
      return initialBlockLogs
    } catch (error) {
      console.warn("[Chain Sync] Primary indexer failed:", error)
    }
  }

  // Try fallback indexer if available
  if (fallbackIndexerUrl) {
    try {
      console.log(
        "[Chain Sync] Attempting to get snapshot with fallback indexer:",
        fallbackIndexerUrl
      )
      const { initialBlockLogs } = await getSnapshot({
        ...baseConfig,
        indexerUrl: fallbackIndexerUrl
      })
      return initialBlockLogs
    } catch (error) {
      console.warn("[Chain Sync] Fallback indexer failed:", error)
    }
  }

  // Try default chain indexer if available
  if (defaultChainIndexerUrl) {
    try {
      console.log(
        "[Chain Sync] Attempting to get snapshot with default chain indexer:",
        defaultChainIndexerUrl
      )
      const { initialBlockLogs } = await getSnapshot({
        ...baseConfig,
        indexerUrl: defaultChainIndexerUrl
      })
      return initialBlockLogs
    } catch (error) {
      console.warn("[Chain Sync] Default chain indexer failed:", error)
    }
  }

  return undefined
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

export async function setupPublicNetwork(
  networkConfig: NetworkConfig,
  devMode: boolean,
  publicClient?: PublicClient<Transport, Chain>,
  initialBlockLogs?: StorageAdapterBlock
): Promise<SetupPublicNetworkResult> {
  const basicNetwork = await setupPublicBasicNetwork(networkConfig, devMode)
  publicClient ??= basicNetwork.publicClient

  /*
   * Sync on-chain state into RECS and keeps our client in sync.
   * Uses the MUD indexer if available, otherwise falls back
   * to the viem publicClient to make RPC calls to fetch MUD
   * events from the chain.
   *
   * If initialBlockLogs is provided, skip indexer hydration and start
   * live sync from that block (used for server-side hydration).
   */

  if (!initialBlockLogs) {
    // Normal flow: try indexers with fallback
    initialBlockLogs = await getSnapshotWithFallback(
      {
        storeAddress: networkConfig.worldAddress,
        chainId: networkConfig.chainId,
        startBlock: BigInt(networkConfig.initialBlockNumber)
      },
      networkConfig.indexerUrl,
      networkConfig.fallbackIndexerUrl,
      networkConfig.chain.indexerUrl
    )
  } else {
    // Skip indexer - use server-provided data instead
    // Note: indexerUrl must be `false` (not undefined) to prevent MUD from
    // falling back to chain.indexerUrl for live subscriptions
    console.log(
      "[Chain Sync] Skipping indexer, using server hydration from block:",
      initialBlockLogs.blockNumber.toString()
    )
  }

  if (!initialBlockLogs) {
    console.log("[Chain Sync] Indexer snapshot failed, falling back to RPC")
  }

  const { components, latestBlock$, storedBlockLogs$, waitForTransaction } = await syncToRecs({
    world,
    config: mudConfig,
    address: networkConfig.worldAddress as Hex,
    publicClient,
    initialBlockLogs,
    indexerUrl: false,
    startBlock: initialBlockLogs
      ? initialBlockLogs.blockNumber
      : BigInt(networkConfig.initialBlockNumber)
  })

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
