import type { Hex } from "viem"
import { StorageAdapterBlock } from "@latticexyz/store-sync"
import { ENVIRONMENT } from "@ratfun/common/basic-network"
import {
  getNetworkConfig,
  setupPublicNetwork,
  SetupPublicNetworkResult,
  IndexerUrlConfig
} from "@ratfun/common/mud"
import {
  waitForChainSync,
  fetchConfig,
  fetchWorldStats,
  fetchPlayers
} from "$lib/modules/chain-sync"
import { publicNetwork, ready, initBlockListener } from "$lib/modules/network"
import { entities } from "$lib/modules/state/stores"
import { WORLD_OBJECT_ID } from "$lib/modules/state/constants"
import { env } from "$env/dynamic/public"
import { createLogger } from "$lib/modules/logger"

const logger = createLogger("[PublicNetwork]")

// Staleness threshold - if server data is more than this many blocks behind, sync from indexer
const STALENESS_THRESHOLD_BLOCKS = 60n

interface InitPublicNetworkOptions {
  environment: ENVIRONMENT
  url: URL
}

interface InitPublicNetworkResult {
  publicClient: SetupPublicNetworkResult["publicClient"]
  transport: SetupPublicNetworkResult["transport"]
  worldAddress: Hex
  /** Whether server config was available and fresh (indexer was skipped) */
  serverDataFresh: boolean
}

/**
 * Get indexer URL configuration based on the current environment.
 * Environment variables override chain defaults when set.
 */
function getIndexerUrlConfig(environment: ENVIRONMENT): IndexerUrlConfig | null {
  switch (environment) {
    case ENVIRONMENT.BASE:
      if (env.PUBLIC_BASE_INDEXER_URL || env.PUBLIC_BASE_FALLBACK_INDEXER_URL) {
        return {
          indexerUrl: env.PUBLIC_BASE_INDEXER_URL || undefined,
          fallbackIndexerUrl: env.PUBLIC_BASE_FALLBACK_INDEXER_URL || undefined
        }
      }
      return null
    case ENVIRONMENT.BASE_SEPOLIA:
      if (env.PUBLIC_BASE_SEPOLIA_INDEXER_URL || env.PUBLIC_BASE_SEPOLIA_FALLBACK_INDEXER_URL) {
        return {
          indexerUrl: env.PUBLIC_BASE_SEPOLIA_INDEXER_URL || undefined,
          fallbackIndexerUrl: env.PUBLIC_BASE_SEPOLIA_FALLBACK_INDEXER_URL || undefined
        }
      }
      return null
    default:
      return null
  }
}

/**
 * Get current block number via direct RPC call.
 * Used to check server data staleness before MUD setup.
 */
async function getCurrentBlockNumber(rpcUrl: string): Promise<bigint> {
  const response = await fetch(rpcUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      method: "eth_blockNumber",
      params: [],
      id: 1
    }),
    signal: AbortSignal.timeout(5000)
  })
  const data = await response.json()
  return BigInt(data.result)
}

/**
 * Initialize the public network connection and wait for chain sync to complete.
 * Sets up MUD layer, waits for indexer sync, and starts block listener.
 *
 * Strategy:
 * 1. Fetch global config from server (if hydration enabled)
 * 2. Check if server data is fresh (within STALENESS_THRESHOLD_BLOCKS)
 * 3. If fresh → skip indexer, use server data
 * 4. If stale → sync from indexer for reliable data
 *
 * Returns the publicClient and transport for use by other systems (e.g. drawbridge).
 *
 * @param options.environment - The environment to connect to
 * @param options.url - The URL (for query params like worldAddress)
 */
export async function initPublicNetwork(
  options: InitPublicNetworkOptions
): Promise<InitPublicNetworkResult> {
  const { environment, url } = options

  // Get network config early - we need the RPC URL to check staleness
  const indexerUrlConfig = getIndexerUrlConfig(environment)
  const networkConfig = getNetworkConfig(environment, url, null, indexerUrlConfig)
  const rpcUrl = networkConfig.chain.rpcUrls.default.http[0]

  // Fetch global config from server (if enabled)
  logger.log("Fetching global config...")
  const configResult = await fetchConfig(environment)

  let skipIndexer = false
  let initialBlockLogs: StorageAdapterBlock | undefined

  if (configResult) {
    // Check staleness before deciding to skip indexer
    try {
      const currentBlock = await getCurrentBlockNumber(rpcUrl)
      const blocksBehind = currentBlock - configResult.blockNumber

      if (blocksBehind <= STALENESS_THRESHOLD_BLOCKS) {
        logger.log(`Server data is fresh (${blocksBehind} blocks behind), skipping indexer`)
        skipIndexer = true
        initialBlockLogs = {
          blockNumber: configResult.blockNumber,
          logs: [] as const
        }
      } else {
        logger.warn(`Server data is stale (${blocksBehind} blocks behind), will sync from indexer`)
      }
    } catch (error) {
      logger.warn("Could not check staleness, will sync from indexer:", error)
    }

    // Always set WorldObject from server config (even if stale, it's better than nothing initially)
    entities.update(current => ({
      ...current,
      [WORLD_OBJECT_ID]: configResult.worldObject
    }))

    // Fetch world stats in background (non-blocking)
    fetchWorldStats(environment).then(statsResult => {
      if (statsResult) {
        entities.update(current => {
          const currentWorldObject = current[WORLD_OBJECT_ID] as WorldObject | undefined
          if (!currentWorldObject) return current
          return {
            ...current,
            [WORLD_OBJECT_ID]: {
              ...currentWorldObject,
              worldStats: statsResult.worldStats
            }
          }
        })
      }
    })

    // Fetch all players in background (non-blocking)
    fetchPlayers(environment).then(playersResult => {
      if (playersResult) {
        entities.update(current => ({
          ...current,
          ...playersResult.entities
        }))
      }
    })
  } else {
    logger.log("No server config, will sync from indexer")
  }

  // Setup MUD layer
  const indexerStartTime = performance.now()

  // Timeout for setupPublicNetwork to prevent Firefox hanging on refresh
  const NETWORK_SETUP_TIMEOUT_MS = 30000
  const mudLayer = await Promise.race([
    setupPublicNetwork(
      networkConfig,
      import.meta.env.DEV,
      undefined, // publicClient
      initialBlockLogs // skip indexer when set
    ),
    new Promise<never>((_, reject) =>
      setTimeout(() => {
        logger.error(`Network setup timeout after ${NETWORK_SETUP_TIMEOUT_MS}ms`)
        reject(new Error(`Network setup timeout after ${NETWORK_SETUP_TIMEOUT_MS}ms`))
      }, NETWORK_SETUP_TIMEOUT_MS)
    )
  ])
  publicNetwork.set(mudLayer)

  // Wait for chain sync to complete (instant if we skipped indexer)
  await waitForChainSync()

  // Log timing
  const elapsed = (performance.now() - indexerStartTime).toFixed(0)
  if (skipIndexer) {
    logger.log(`MUD setup complete in ${elapsed}ms (indexer skipped)`)
  } else {
    logger.log(`Indexer sync complete in ${elapsed}ms`)
  }

  // Mark as ready (for any components that need to check sync status)
  ready.set(true)

  // Start listening to block updates
  initBlockListener()

  // Return publicClient and transport for reuse by other systems
  return {
    publicClient: mudLayer.publicClient,
    transport: mudLayer.transport,
    worldAddress: mudLayer.worldAddress,
    serverDataFresh: skipIndexer
  }
}
