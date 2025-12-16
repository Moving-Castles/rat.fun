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
  LeaderboardResponse
} from "query-server/types"

// Re-export types for convenience
export type { RatLeaderboardEntry, TripLeaderboardEntry, LeaderboardResponse }

/**
 * Fetch active rats leaderboard (by total value: balance + inventory)
 */
export async function fetchActiveRatsLeaderboard(
  environment: ENVIRONMENT
): Promise<LeaderboardResponse<RatLeaderboardEntry> | null> {
  const baseUrl = getQueryServerUrl(environment)
  if (!baseUrl) return null

  try {
    const url = new URL("/api/leaderboard/active-rats", baseUrl)

    const response = await fetch(url, {
      signal: AbortSignal.timeout(10000)
    })

    if (!response.ok) {
      throw new Error(`Server returned ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.warn("[fetchActiveRatsLeaderboard] Failed:", error)
    return null
  }
}

/**
 * Fetch cashed out rats leaderboard (by liquidation value)
 */
export async function fetchCashedOutRatsLeaderboard(
  environment: ENVIRONMENT
): Promise<LeaderboardResponse<RatLeaderboardEntry> | null> {
  const baseUrl = getQueryServerUrl(environment)
  if (!baseUrl) return null

  try {
    const url = new URL("/api/leaderboard/cashed-out-rats", baseUrl)

    const response = await fetch(url, {
      signal: AbortSignal.timeout(10000)
    })

    if (!response.ok) {
      throw new Error(`Server returned ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.warn("[fetchCashedOutRatsLeaderboard] Failed:", error)
    return null
  }
}

/**
 * Fetch active trips leaderboard (by balance)
 */
export async function fetchActiveTripsLeaderboard(
  environment: ENVIRONMENT
): Promise<LeaderboardResponse<TripLeaderboardEntry> | null> {
  const baseUrl = getQueryServerUrl(environment)
  if (!baseUrl) return null

  try {
    const url = new URL("/api/leaderboard/active-trips", baseUrl)

    const response = await fetch(url, {
      signal: AbortSignal.timeout(10000)
    })

    if (!response.ok) {
      throw new Error(`Server returned ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.warn("[fetchActiveTripsLeaderboard] Failed:", error)
    return null
  }
}

/**
 * Fetch cashed out trips leaderboard (by liquidation value)
 */
export async function fetchCashedOutTripsLeaderboard(
  environment: ENVIRONMENT
): Promise<LeaderboardResponse<TripLeaderboardEntry> | null> {
  const baseUrl = getQueryServerUrl(environment)
  if (!baseUrl) return null

  try {
    const url = new URL("/api/leaderboard/cashed-out-trips", baseUrl)

    const response = await fetch(url, {
      signal: AbortSignal.timeout(10000)
    })

    if (!response.ok) {
      throw new Error(`Server returned ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.warn("[fetchCashedOutTripsLeaderboard] Failed:", error)
    return null
  }
}
