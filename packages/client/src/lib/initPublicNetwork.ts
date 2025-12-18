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

interface InitPublicNetworkOptions {
  environment: ENVIRONMENT
  url: URL
}

interface InitPublicNetworkResult {
  publicClient: SetupPublicNetworkResult["publicClient"]
  transport: SetupPublicNetworkResult["transport"]
  worldAddress: Hex
  configFromServer: boolean
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
 * Initialize the public network connection and wait for chain sync to complete.
 * Sets up MUD layer, waits for indexer sync, and starts block listener.
 *
 * Fetches global config from server if hydration is enabled, which populates
 * the entities["0x"] WorldObject with GameConfig, ExternalAddressesConfig, etc.
 * When server config is available, the indexer is skipped entirely.
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

  // Fetch global config from server (if enabled)
  // This gives us ExternalAddressesConfig needed for allowance checks
  // and a blockNumber to skip the indexer sync
  console.log("[initPublicNetwork] Fetching global config...")
  const configResult = await fetchConfig(environment)

  let initialBlockLogs: StorageAdapterBlock | undefined

  if (configResult) {
    console.log("[initPublicNetwork] Config fetched from server, will skip indexer")
    // Set the WorldObject in entities store
    entities.update(current => ({
      ...current,
      [WORLD_OBJECT_ID]: configResult.worldObject
    }))
    // Prepare initialBlockLogs to skip indexer
    initialBlockLogs = {
      blockNumber: configResult.blockNumber,
      logs: [] as const
    }

    // Fetch world stats in background (non-blocking)
    // Stats are fetched separately since they change frequently and shouldn't be cached
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
    // Players are fetched separately to not block initial load
    fetchPlayers(environment).then(playersResult => {
      if (playersResult) {
        entities.update(current => ({
          ...current,
          ...playersResult.entities
        }))
      }
    })
  } else {
    console.log("[initPublicNetwork] No server config, will sync from indexer")
  }

  // Setup MUD layer (skip indexer if we have server config)
  // Time the indexer sync when not using server hydration
  const indexerStartTime = !configResult ? performance.now() : null
  const indexerUrlConfig = getIndexerUrlConfig(environment)
  const networkConfig = getNetworkConfig(environment, url, null, indexerUrlConfig)
  const mudLayer = await setupPublicNetwork(
    networkConfig,
    import.meta.env.DEV,
    undefined, // publicClient
    initialBlockLogs // skip indexer when set
  )
  publicNetwork.set(mudLayer)

  // Wait for chain sync to complete (instant if we skipped indexer)
  await waitForChainSync()

  // Log indexer sync time when using indexer path
  if (indexerStartTime !== null) {
    const elapsed = (performance.now() - indexerStartTime).toFixed(0)
    console.log(`[initPublicNetwork] Indexer sync complete in ${elapsed}ms`)
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
    configFromServer: !!configResult
  }
}
