/**
 * Server Hydration Service
 *
 * Fetches pre-filtered entity data from the hydration server.
 * This bypasses the MUD indexer and only downloads data the player needs.
 */

import { env } from "$env/dynamic/public"
import { ENVIRONMENT } from "@ratfun/common/basic-network"
import { ENTITY_TYPE } from "contracts/enums"
import { parseEther, type Hex } from "viem"
import type { HydrationResponse } from "query-server/types"

// Client result type
export interface ServerHydrationResult {
  blockNumber: bigint
  entities: Entities
}

/**
 * Get hydration URL for current environment
 */
export function getHydrationUrl(environment: ENVIRONMENT): string | null {
  switch (environment) {
    case ENVIRONMENT.BASE:
      return env.PUBLIC_BASE_HYDRATION_URL || null
    case ENVIRONMENT.BASE_SEPOLIA:
      return env.PUBLIC_BASE_SEPOLIA_HYDRATION_URL || null
    default:
      return null
  }
}

/**
 * Safely parse ETH string to bigint, returning 0n on failure
 */
function safeParseEther(value: string | null): bigint {
  if (!value) return 0n
  try {
    return parseEther(value)
  } catch {
    return 0n
  }
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
    balance: safeParseEther(response.player.balance),
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
      balance: safeParseEther(response.currentRat.balance),
      owner: (response.currentRat.owner as Hex) ?? undefined,
      dead: response.currentRat.dead,
      inventory: response.currentRat.inventory.map(i => i.id) as readonly Hex[],
      creationBlock: safeParseBigInt(response.currentRat.creationBlock),
      tripCount: safeParseBigInt(response.currentRat.tripCount),
      liquidated: response.currentRat.liquidated,
      liquidationValue: response.currentRat.liquidationValue
        ? safeParseEther(response.currentRat.liquidationValue)
        : undefined,
      liquidationBlock: response.currentRat.liquidationBlock
        ? safeParseBigInt(response.currentRat.liquidationBlock)
        : undefined
    }
  }

  // Transform trips
  for (const trip of response.trips) {
    entities[trip.id] = {
      entityType: ENTITY_TYPE.TRIP,
      name: trip.name ?? undefined,
      owner: (trip.owner as Hex) ?? undefined,
      index: safeParseBigInt(trip.index),
      balance: safeParseEther(trip.balance),
      prompt: trip.prompt ?? undefined,
      visitCount: safeParseBigInt(trip.visitCount),
      killCount: safeParseBigInt(trip.killCount),
      creationBlock: safeParseBigInt(trip.creationBlock),
      lastVisitBlock: safeParseBigInt(trip.lastVisitBlock),
      tripCreationCost: safeParseEther(trip.tripCreationCost),
      liquidated: trip.liquidated,
      liquidationValue: trip.liquidationValue ? safeParseEther(trip.liquidationValue) : undefined,
      liquidationBlock: trip.liquidationBlock ? safeParseBigInt(trip.liquidationBlock) : undefined
    }
  }

  // Transform items
  for (const item of response.items) {
    entities[item.id] = {
      entityType: ENTITY_TYPE.ITEM,
      name: item.name ?? undefined,
      value: safeParseEther(item.value)
    }
  }

  // Transform other players (minimal props only)
  for (const other of response.otherPlayers) {
    entities[other.id] = {
      entityType: ENTITY_TYPE.PLAYER,
      name: other.name ?? undefined
    }
  }

  return entities
}

/**
 * Attempt to hydrate from the server.
 * Returns null if hydration URL not configured or request fails.
 */
export async function hydrateFromServer(
  playerId: string,
  environment: ENVIRONMENT
): Promise<ServerHydrationResult | null> {
  const hydrationUrl = getHydrationUrl(environment)
  if (!hydrationUrl) {
    console.log("[hydrateFromServer] No hydration URL configured")
    return null
  }

  try {
    console.log("[hydrateFromServer] Fetching from:", hydrationUrl)
    const response = await fetch(`${hydrationUrl}/api/hydration/${playerId}`, {
      signal: AbortSignal.timeout(10000) // 10s timeout
    })

    if (!response.ok) {
      throw new Error(`Server returned ${response.status}`)
    }

    const data: HydrationResponse = await response.json()
    const entities = transformResponse(data)
    const blockNumber = safeParseBigInt(data.blockNumber)

    console.log(
      "[hydrateFromServer] Success, loaded",
      Object.keys(entities).length,
      "entities at block",
      blockNumber.toString()
    )
    return { blockNumber, entities }
  } catch (error) {
    console.warn("[hydrateFromServer] Failed, will fallback to indexer:", error)
    return null
  }
}
