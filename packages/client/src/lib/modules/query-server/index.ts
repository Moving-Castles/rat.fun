/**
 * Query Server Client
 *
 * Client functions for fetching data from the query-server API.
 */

import { ENVIRONMENT } from "@ratfun/common/basic-network"
import { getQueryServerUrl } from "$lib/modules/chain-sync/hydrateFromServer"
import type {
  RatLeaderboardEntry,
  TripLeaderboardEntry,
  RatsKilledEntry,
  LeaderboardResponse
} from "query-server/types"

// Re-export types for convenience
export type { RatLeaderboardEntry, TripLeaderboardEntry, RatsKilledEntry, LeaderboardResponse }

/**
 * Fetch active rats leaderboard (by total value: balance + inventory)
 */
export async function fetchActiveRatLeaderboard(
  environment: ENVIRONMENT,
  limit?: number
): Promise<LeaderboardResponse<RatLeaderboardEntry> | null> {
  const baseUrl = getQueryServerUrl(environment)
  if (!baseUrl) return null

  try {
    const url = new URL("/api/leaderboard/rat-value/active", baseUrl)
    if (limit) url.searchParams.set("limit", String(limit))

    const response = await fetch(url, {
      signal: AbortSignal.timeout(10000)
    })

    if (!response.ok) {
      throw new Error(`Server returned ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.warn("[fetchActiveRatLeaderboard] Failed:", error)
    return null
  }
}

/**
 * Fetch all-time rats leaderboard (uses liquidation value for liquidated rats)
 */
export async function fetchAllTimeRatLeaderboard(
  environment: ENVIRONMENT,
  limit?: number
): Promise<LeaderboardResponse<RatLeaderboardEntry> | null> {
  const baseUrl = getQueryServerUrl(environment)
  if (!baseUrl) return null

  try {
    const url = new URL("/api/leaderboard/rat-value/all-time", baseUrl)
    if (limit) url.searchParams.set("limit", String(limit))

    const response = await fetch(url, {
      signal: AbortSignal.timeout(10000)
    })

    if (!response.ok) {
      throw new Error(`Server returned ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.warn("[fetchAllTimeRatLeaderboard] Failed:", error)
    return null
  }
}

/**
 * Fetch active trips leaderboard (by balance)
 */
export async function fetchActiveTripLeaderboard(
  environment: ENVIRONMENT,
  limit?: number
): Promise<LeaderboardResponse<TripLeaderboardEntry> | null> {
  const baseUrl = getQueryServerUrl(environment)
  if (!baseUrl) return null

  try {
    const url = new URL("/api/leaderboard/trip-value/active", baseUrl)
    if (limit) url.searchParams.set("limit", String(limit))

    const response = await fetch(url, {
      signal: AbortSignal.timeout(10000)
    })

    if (!response.ok) {
      throw new Error(`Server returned ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.warn("[fetchActiveTripLeaderboard] Failed:", error)
    return null
  }
}

/**
 * Fetch all-time trips leaderboard (uses liquidation value for liquidated trips)
 */
export async function fetchAllTimeTripLeaderboard(
  environment: ENVIRONMENT,
  limit?: number
): Promise<LeaderboardResponse<TripLeaderboardEntry> | null> {
  const baseUrl = getQueryServerUrl(environment)
  if (!baseUrl) return null

  try {
    const url = new URL("/api/leaderboard/trip-value/all-time", baseUrl)
    if (limit) url.searchParams.set("limit", String(limit))

    const response = await fetch(url, {
      signal: AbortSignal.timeout(10000)
    })

    if (!response.ok) {
      throw new Error(`Server returned ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.warn("[fetchAllTimeTripLeaderboard] Failed:", error)
    return null
  }
}

/**
 * Fetch players ranked by rats killed (pastRats count)
 */
export async function fetchRatsKilledLeaderboard(
  environment: ENVIRONMENT,
  limit?: number
): Promise<LeaderboardResponse<RatsKilledEntry> | null> {
  const baseUrl = getQueryServerUrl(environment)
  if (!baseUrl) return null

  try {
    const url = new URL("/api/leaderboard/rats-killed", baseUrl)
    if (limit) url.searchParams.set("limit", String(limit))

    const response = await fetch(url, {
      signal: AbortSignal.timeout(10000)
    })

    if (!response.ok) {
      throw new Error(`Server returned ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.warn("[fetchRatsKilledLeaderboard] Failed:", error)
    return null
  }
}
