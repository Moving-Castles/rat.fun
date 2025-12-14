import type { Hex } from "viem"
import { ENVIRONMENT } from "@ratfun/common/basic-network"
import {
  getNetworkConfig,
  setupPublicNetwork,
  SetupPublicNetworkResult,
  IndexerUrlConfig,
  InitialBlockLogs
} from "@ratfun/common/mud"
import { waitForChainSync, hydrateFromServer } from "$lib/modules/chain-sync"
import {
  publicNetwork,
  ready,
  initBlockListener,
  environment as envStore
} from "$lib/modules/network"
import { entities } from "$lib/modules/state/stores"
import { addressToId } from "$lib/modules/utils"
import { env } from "$env/dynamic/public"

interface InitPublicNetworkOptions {
  environment: ENVIRONMENT
  url: URL
  userAddress?: string // Optional - for server hydration
}

interface InitPublicNetworkResult {
  publicClient: SetupPublicNetworkResult["publicClient"]
  transport: SetupPublicNetworkResult["transport"]
  worldAddress: Hex
  usedServerHydration: boolean
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
 * If userAddress is provided and a hydration server is configured, attempts
 * server-side hydration first (skips indexer, loads filtered data directly).
 *
 * Returns the publicClient and transport for use by other systems (e.g. drawbridge).
 *
 * @param options.environment - The environment to connect to
 * @param options.url - The URL (for query params like worldAddress)
 * @param options.userAddress - Optional user address for server hydration
 */
export async function initPublicNetwork(
  options: InitPublicNetworkOptions
): Promise<InitPublicNetworkResult> {
  const { environment, url, userAddress } = options

  let initialBlockLogs: InitialBlockLogs | undefined
  let serverEntities: Entities | undefined

  // Try server hydration if user address provided (hydrateFromServer checks env config)
  if (userAddress) {
    const playerId = addressToId(userAddress)
    console.log("[initPublicNetwork] Attempting server hydration for player:", playerId)

    const result = await hydrateFromServer(playerId, environment)

    if (result) {
      initialBlockLogs = { blockNumber: result.blockNumber, logs: [] as const }
      serverEntities = result.entities
      console.log(
        "[initPublicNetwork] Server hydration succeeded, block:",
        result.blockNumber.toString()
      )
    } else {
      console.log("[initPublicNetwork] Server hydration failed, falling back to indexer")
    }
  }

  // Setup MUD layer (with or without indexer skip)
  const indexerUrlConfig = getIndexerUrlConfig(environment)
  const networkConfig = getNetworkConfig(environment, url, null, indexerUrlConfig)
  const mudLayer = await setupPublicNetwork(
    networkConfig,
    import.meta.env.DEV,
    undefined,
    initialBlockLogs
  )
  publicNetwork.set(mudLayer)

  // If server hydration succeeded, set entities store directly
  if (serverEntities) {
    console.log("[initPublicNetwork] Setting entities from server hydration")
    entities.set(serverEntities)
  }

  // Wait for chain sync to complete (fast if we skipped indexer)
  await waitForChainSync()

  // Mark as ready (for any components that need to check sync status)
  ready.set(true)

  // Start listening to block updates
  initBlockListener()

  // Return publicClient and transport for reuse by other systems
  return {
    publicClient: mudLayer.publicClient,
    transport: mudLayer.transport,
    worldAddress: mudLayer.worldAddress,
    usedServerHydration: !!serverEntities
  }
}
