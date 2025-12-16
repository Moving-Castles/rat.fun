/**
 * Server Hydration Service
 *
 * Fetches pre-filtered entity data from the hydration server.
 * This bypasses the MUD indexer and only downloads data the player needs.
 */

import { env } from "$env/dynamic/public"
import { ENVIRONMENT } from "@ratfun/common/basic-network"
import { ENTITY_TYPE } from "contracts/enums"
import { type Hex, type Address } from "viem"
import type {
  HydrationResponse,
  GlobalConfigsResponse,
  PlayersEndpointResponse,
  TripsEndpointResponse
} from "query-server/types"

// Client result type
export interface ServerHydrationResult {
  blockNumber: bigint
  entities: Entities
}

/**
 * Get query server URL for current environment
 */
export function getQueryServerUrl(environment: ENVIRONMENT): string | null {
  switch (environment) {
    case ENVIRONMENT.BASE:
      return env.PUBLIC_BASE_QUERY_SERVER_URL || null
    case ENVIRONMENT.BASE_SEPOLIA:
      return env.PUBLIC_BASE_SEPOLIA_QUERY_SERVER_URL || null
    default:
      return null
  }
}

/**
 * Check if hydration from server is enabled
 */
export function shouldHydrateFromServer(): boolean {
  return env.PUBLIC_HYDRATE_FROM_SERVER === "true"
}

/**
 * Safely parse string to bigint, returning 0n on failure
 */
function safeParseBigInt(value: string | null): bigint {
  if (!value) return 0n
  try {
    return BigInt(value)
  } catch {
    return 0n
  }
}

/**
 * Transform server response (ETH strings) to client Entities format (bigints)
 */
function transformResponse(response: HydrationResponse): Entities {
  const entities: Entities = {}

  // Transform player (full props)
  entities[response.player.id] = {
    entityType: ENTITY_TYPE.PLAYER,
    name: response.player.name ?? undefined,
    currentRat: (response.player.currentRat as Hex) ?? undefined,
    pastRats: (response.player.pastRats as readonly Hex[]) ?? [],
    creationBlock: safeParseBigInt(response.player.creationBlock),
    masterKey: response.player.masterKey
  }

  // Transform currentRat (if exists)
  if (response.currentRat) {
    entities[response.currentRat.id] = {
      entityType: ENTITY_TYPE.RAT,
      name: response.currentRat.name ?? undefined,
      index: safeParseBigInt(response.currentRat.index),
      balance: safeParseBigInt(response.currentRat.balance),
      owner: (response.currentRat.owner as Hex) ?? undefined,
      dead: response.currentRat.dead,
      inventory: response.currentRat.inventory.map(i => i.id) as readonly Hex[],
      creationBlock: safeParseBigInt(response.currentRat.creationBlock),
      tripCount: safeParseBigInt(response.currentRat.tripCount),
      liquidated: response.currentRat.liquidated,
      liquidationValue: response.currentRat.liquidationValue
        ? safeParseBigInt(response.currentRat.liquidationValue)
        : undefined,
      liquidationBlock: response.currentRat.liquidationBlock
        ? safeParseBigInt(response.currentRat.liquidationBlock)
        : undefined
    }
  }

  // Transform items
  for (const item of response.items) {
    entities[item.id] = {
      entityType: ENTITY_TYPE.ITEM,
      name: item.name ?? undefined,
      value: safeParseBigInt(item.value)
    }
  }

  return entities
}

// Config result type for WorldObject
export interface ConfigResult {
  blockNumber: bigint
  worldObject: WorldObject
}

// World stats result type
export interface WorldStatsResult {
  blockNumber: bigint
  worldStats: WorldStatsObject
}

// Server world stats response type
interface WorldStatsEndpointResponse {
  blockNumber: string
  globalTripIndex: string | null
  globalRatIndex: string | null
  globalRatKillCount: string | null
  lastKilledRatBlock: string | null
}

/**
 * Transform global config response to WorldObject format for entities["0x"]
 */
function transformConfigResponse(config: GlobalConfigsResponse): WorldObject {
  return {
    gameConfig: {
      adminAddress: (config.gameConfig.adminAddress as Address) ?? undefined,
      adminId: (config.gameConfig.adminId as Hex) ?? undefined,
      ratCreationCost: safeParseBigInt(config.gameConfig.ratCreationCost),
      maxInventorySize: Number(config.gameConfig.maxInventorySize) || 0,
      maxTripPromptLength: Number(config.gameConfig.maxTripPromptLength) || 0,
      cooldownCloseTrip: Number(config.gameConfig.cooldownCloseTrip) || 0,
      ratsKilledForAdminAccess: Number(config.gameConfig.ratsKilledForAdminAccess) || 0
    },
    gamePercentagesConfig: {
      maxValuePerWin: Number(config.gamePercentagesConfig.maxValuePerWin) || 0,
      minRatValueToEnter: Number(config.gamePercentagesConfig.minRatValueToEnter) || 0,
      taxationLiquidateRat: Number(config.gamePercentagesConfig.taxationLiquidateRat) || 0,
      taxationCloseTrip: Number(config.gamePercentagesConfig.taxationCloseTrip) || 0
    },
    // WorldStats is fetched separately via fetchWorldStats() - provide defaults
    worldStats: {
      globalTripIndex: 0n,
      globalRatIndex: 0n,
      globalRatKillCount: 0n,
      lastKilledRatBlock: 0n
    },
    externalAddressesConfig: {
      erc20Address: (config.externalAddressesConfig.erc20Address as Address) ?? undefined,
      gamePoolAddress: (config.externalAddressesConfig.gamePoolAddress as Address) ?? undefined,
      mainSaleAddress: (config.externalAddressesConfig.mainSaleAddress as Address) ?? undefined,
      serviceAddress: (config.externalAddressesConfig.serviceAddress as Address) ?? undefined,
      feeAddress: (config.externalAddressesConfig.feeAddress as Address) ?? undefined
    },
    // WorldEvent not used currently - provide empty defaults
    worldEvent: {
      creationBlock: 0n,
      expirationBlock: 0n,
      cmsId: "",
      title: "",
      prompt: ""
    }
  }
}

/**
 * Fetch global config from server.
 * Returns null if server hydration is disabled, URL not configured, or request fails.
 */
export async function fetchConfig(environment: ENVIRONMENT): Promise<ConfigResult | null> {
  if (!shouldHydrateFromServer()) {
    console.log("[fetchConfig] Server hydration is disabled")
    return null
  }

  const queryServerUrl = getQueryServerUrl(environment)
  if (!queryServerUrl) {
    console.log("[fetchConfig] No query server URL configured")
    return null
  }

  const startTime = performance.now()

  try {
    const url = `${queryServerUrl}/api/config`
    console.log("[fetchConfig] Fetching from:", url)
    const response = await fetch(url, {
      signal: AbortSignal.timeout(10000)
    })

    if (!response.ok) {
      throw new Error(`Server returned ${response.status}`)
    }

    const data: GlobalConfigsResponse = await response.json()
    const worldObject = transformConfigResponse(data)
    const blockNumber = safeParseBigInt(data.blockNumber)
    const elapsed = (performance.now() - startTime).toFixed(0)

    console.log(`[fetchConfig] Success in ${elapsed}ms, block: ${blockNumber}`)
    return { blockNumber, worldObject }
  } catch (error) {
    const elapsed = (performance.now() - startTime).toFixed(0)
    console.warn(`[fetchConfig] Failed after ${elapsed}ms:`, error)
    return null
  }
}

/**
 * Attempt to hydrate player data from the server.
 * Returns null if hydration is disabled, URL not configured, or request fails.
 */
export async function hydrateFromServer(
  playerId: string,
  environment: ENVIRONMENT
): Promise<ServerHydrationResult | null> {
  if (!shouldHydrateFromServer()) {
    console.log("[hydrateFromServer] Server hydration is disabled")
    return null
  }

  const queryServerUrl = getQueryServerUrl(environment)
  if (!queryServerUrl) {
    console.log("[hydrateFromServer] No query server URL configured")
    return null
  }

  const startTime = performance.now()

  try {
    const url = `${queryServerUrl}/api/hydration/${playerId}?_=${Date.now()}`
    console.log("[hydrateFromServer] Fetching from:", url)
    const response = await fetch(url, {
      signal: AbortSignal.timeout(10000),
      cache: "no-store"
    })

    if (!response.ok) {
      throw new Error(`Server returned ${response.status}`)
    }

    const data: HydrationResponse = await response.json()
    const entities = transformResponse(data)
    const blockNumber = safeParseBigInt(data.blockNumber)
    const elapsed = (performance.now() - startTime).toFixed(0)

    console.log(
      `[hydrateFromServer] Success in ${elapsed}ms, loaded`,
      Object.keys(entities).length,
      "entities at block",
      blockNumber.toString()
    )
    return { blockNumber, entities }
  } catch (error) {
    const elapsed = (performance.now() - startTime).toFixed(0)
    console.warn(`[hydrateFromServer] Failed after ${elapsed}ms:`, error)
    return null
  }
}

/**
 * Fetch world stats from server.
 * Returns null if server hydration is disabled, URL not configured, or request fails.
 * This is fetched separately from config because stats change frequently and shouldn't be cached.
 */
export async function fetchWorldStats(environment: ENVIRONMENT): Promise<WorldStatsResult | null> {
  if (!shouldHydrateFromServer()) {
    return null
  }

  const queryServerUrl = getQueryServerUrl(environment)
  if (!queryServerUrl) {
    return null
  }

  try {
    const url = `${queryServerUrl}/api/world-stats`
    const response = await fetch(url, {
      signal: AbortSignal.timeout(5000),
      cache: "no-store"
    })

    if (!response.ok) {
      throw new Error(`Server returned ${response.status}`)
    }

    const data: WorldStatsEndpointResponse = await response.json()
    const worldStats: WorldStatsObject = {
      globalTripIndex: safeParseBigInt(data.globalTripIndex),
      globalRatIndex: safeParseBigInt(data.globalRatIndex),
      globalRatKillCount: safeParseBigInt(data.globalRatKillCount),
      lastKilledRatBlock: safeParseBigInt(data.lastKilledRatBlock)
    }
    const blockNumber = safeParseBigInt(data.blockNumber)

    console.log(`[fetchWorldStats] Success, block: ${blockNumber}`)
    return { blockNumber, worldStats }
  } catch (error) {
    console.warn("[fetchWorldStats] Failed:", error)
    return null
  }
}

// Players result type
export interface PlayersResult {
  blockNumber: bigint
  entities: Entities
}

/**
 * Fetch all players from server.
 * Returns null if server hydration is disabled, URL not configured, or request fails.
 */
export async function fetchPlayers(environment: ENVIRONMENT): Promise<PlayersResult | null> {
  if (!shouldHydrateFromServer()) {
    return null
  }

  const queryServerUrl = getQueryServerUrl(environment)
  if (!queryServerUrl) {
    return null
  }

  try {
    const url = `${queryServerUrl}/api/players`
    const response = await fetch(url, {
      signal: AbortSignal.timeout(10000),
      cache: "no-store"
    })

    if (!response.ok) {
      throw new Error(`Server returned ${response.status}`)
    }

    const data: PlayersEndpointResponse = await response.json()
    const entities: Entities = {}

    // Transform players (minimal props only)
    for (const player of data.players) {
      entities[player.id] = {
        entityType: ENTITY_TYPE.PLAYER,
        name: player.name ?? undefined
      }
    }

    const blockNumber = safeParseBigInt(data.blockNumber)
    console.log(
      `[fetchPlayers] Success, loaded ${data.players.length} players at block ${blockNumber}`
    )
    return { blockNumber, entities }
  } catch (error) {
    console.warn("[fetchPlayers] Failed:", error)
    return null
  }
}

// Trips result type
export interface TripsResult {
  blockNumber: bigint
  entities: Entities
}

/**
 * Fetch trips for a specific player from server.
 * Returns null if server hydration is disabled, URL not configured, or request fails.
 */
export async function fetchTrips(
  playerId: string,
  environment: ENVIRONMENT
): Promise<TripsResult | null> {
  if (!shouldHydrateFromServer()) {
    return null
  }

  const queryServerUrl = getQueryServerUrl(environment)
  if (!queryServerUrl) {
    return null
  }

  try {
    const url = `${queryServerUrl}/api/trips/${playerId}`
    const response = await fetch(url, {
      signal: AbortSignal.timeout(10000),
      cache: "no-store"
    })

    if (!response.ok) {
      throw new Error(`Server returned ${response.status}`)
    }

    const data: TripsEndpointResponse = await response.json()
    const entities: Entities = {}

    // Transform trips
    for (const trip of data.trips) {
      entities[trip.id] = {
        entityType: ENTITY_TYPE.TRIP,
        owner: (trip.owner as Hex) ?? undefined,
        index: safeParseBigInt(trip.index),
        balance: safeParseBigInt(trip.balance),
        prompt: trip.prompt ?? undefined,
        visitCount: safeParseBigInt(trip.visitCount),
        killCount: safeParseBigInt(trip.killCount),
        creationBlock: safeParseBigInt(trip.creationBlock),
        lastVisitBlock: safeParseBigInt(trip.lastVisitBlock),
        tripCreationCost: safeParseBigInt(trip.tripCreationCost),
        liquidated: trip.liquidated,
        liquidationValue: trip.liquidationValue
          ? safeParseBigInt(trip.liquidationValue)
          : undefined,
        liquidationBlock: trip.liquidationBlock ? safeParseBigInt(trip.liquidationBlock) : undefined
      }
    }

    const blockNumber = safeParseBigInt(data.blockNumber)
    console.log(`[fetchTrips] Success, loaded ${data.trips.length} trips at block ${blockNumber}`)
    return { blockNumber, entities }
  } catch (error) {
    console.warn("[fetchTrips] Failed:", error)
    return null
  }
}
