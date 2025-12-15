import { writable, derived, get } from "svelte/store"
import type { FeedMessage } from "./Feed/types"
import { FEED_MESSAGE_TYPE } from "./Feed/types"
import { environment } from "$lib/modules/network"
import {
  fetchActiveRatLeaderboard,
  fetchAllTimeRatLeaderboard,
  fetchActiveTripLeaderboard,
  fetchAllTimeTripLeaderboard,
  fetchRatsKilledLeaderboard
} from "$lib/modules/query-server"

const MAX_MESSAGES = 200

// Feed messages store
export const feedMessages = writable<FeedMessage[]>([])

// Active filters - when empty, all types are shown
// When populated, only checked types are shown
export const activeFilters = writable<Set<FEED_MESSAGE_TYPE>>(
  new Set([
    FEED_MESSAGE_TYPE.CHAT,
    FEED_MESSAGE_TYPE.NEW_TRIP,
    FEED_MESSAGE_TYPE.NEW_OUTCOME,
    FEED_MESSAGE_TYPE.PLAYER_JOINED
  ])
)

// Filtered messages based on active filters
export const filteredMessages = derived([feedMessages, activeFilters], ([$messages, $filters]) => {
  // If all filters are active, show all
  if ($filters.size === 4) return $messages
  // If no filters active, show nothing
  if ($filters.size === 0) return []
  // Filter by active types
  return $messages.filter(m => $filters.has(m.type))
})

/**
 * Add a message to the feed
 */
export function addFeedMessage(message: FeedMessage) {
  feedMessages.update(messages => {
    // Check for duplicate by id
    if (messages.some(m => m.id === message.id)) {
      return messages
    }

    const updated = [...messages, message]
    // Sort by timestamp
    updated.sort((a, b) => a.timestamp - b.timestamp)
    // Trim to max messages
    if (updated.length > MAX_MESSAGES) {
      return updated.slice(-MAX_MESSAGES)
    }
    return updated
  })
}

/**
 * Add multiple messages at once (for history loading)
 */
export function addFeedMessages(messages: FeedMessage[]) {
  feedMessages.update(existing => {
    const existingIds = new Set(existing.map(m => m.id))
    const newMessages = messages.filter(m => !existingIds.has(m.id))
    const updated = [...existing, ...newMessages]
    // Sort by timestamp
    updated.sort((a, b) => a.timestamp - b.timestamp)
    // Trim to max messages
    if (updated.length > MAX_MESSAGES) {
      return updated.slice(-MAX_MESSAGES)
    }
    return updated
  })
}

/**
 * Toggle a filter on/off
 */
export function toggleFilter(type: FEED_MESSAGE_TYPE) {
  activeFilters.update(filters => {
    const newFilters = new Set(filters)
    if (newFilters.has(type)) {
      newFilters.delete(type)
    } else {
      newFilters.add(type)
    }
    return newFilters
  })
}

/**
 * Set filter state directly
 */
export function setFilter(type: FEED_MESSAGE_TYPE, enabled: boolean) {
  activeFilters.update(filters => {
    const newFilters = new Set(filters)
    if (enabled) {
      newFilters.add(type)
    } else {
      newFilters.delete(type)
    }
    return newFilters
  })
}

/**
 * Clear all messages
 */
export function clearFeedMessages() {
  feedMessages.set([])
}

// Phone view state for operator feed
export const phoneActiveFeedView = writable<"feed" | "stats">("feed")

// Leaderboard types (for display)
export type RatLeaderboardEntry = {
  id: string
  name: string
  ownerName: string
  value: number
  rank: number
}

export type KillsLeaderboardEntry = {
  playerId: string
  playerName: string
  kills: number
  rank: number
}

export type TripLeaderboardEntry = {
  tripId: string
  tripTitle: string
  ownerName: string
  balance: number
  rank: number
}

/**
 * Parse ETH string to number, rounding to 2 decimal places
 */
function parseEthValue(ethString: string): number {
  const value = parseFloat(ethString)
  return isNaN(value) ? 0 : Math.round(value * 100) / 100
}

// Leaderboard stores
export const ratLeaderboard = writable<RatLeaderboardEntry[]>([])
export const killsLeaderboard = writable<KillsLeaderboardEntry[]>([])
export const tripLeaderboard = writable<TripLeaderboardEntry[]>([])

export const ratLeaderboardMode = writable<"alive" | "all_time">("alive")
export const tripLeaderboardMode = writable<"active" | "all_time">("active")

// Loading states
export const ratLeaderboardLoading = writable(false)
export const killsLeaderboardLoading = writable(false)
export const tripLeaderboardLoading = writable(false)

const LEADERBOARD_LIMIT = 10

/**
 * Load rat leaderboard data based on current mode
 */
export async function loadRatLeaderboard() {
  const env = get(environment)
  const mode = get(ratLeaderboardMode)

  ratLeaderboardLoading.set(true)

  try {
    const response =
      mode === "alive"
        ? await fetchActiveRatLeaderboard(env, LEADERBOARD_LIMIT)
        : await fetchAllTimeRatLeaderboard(env, LEADERBOARD_LIMIT)

    if (response) {
      const entries: RatLeaderboardEntry[] = response.entries.map((entry, index) => ({
        id: entry.id,
        name: entry.name || "Unnamed Rat",
        ownerName:
          entry.ownerName ||
          (entry.owner ? `${entry.owner.slice(0, 6)}...${entry.owner.slice(-4)}` : "Unknown"),
        value: parseEthValue(entry.totalValue),
        rank: index + 1
      }))
      ratLeaderboard.set(entries)
    }
  } catch (error) {
    console.error("[loadRatLeaderboard] Error:", error)
  } finally {
    ratLeaderboardLoading.set(false)
  }
}

/**
 * Load kills leaderboard data
 */
export async function loadKillsLeaderboard() {
  const env = get(environment)

  killsLeaderboardLoading.set(true)

  try {
    const response = await fetchRatsKilledLeaderboard(env, LEADERBOARD_LIMIT)

    if (response) {
      const entries: KillsLeaderboardEntry[] = response.entries.map((entry, index) => ({
        playerId: entry.id,
        playerName: entry.name || `${entry.id.slice(0, 6)}...${entry.id.slice(-4)}`,
        kills: entry.ratsKilled,
        rank: index + 1
      }))
      killsLeaderboard.set(entries)
    }
  } catch (error) {
    console.error("[loadKillsLeaderboard] Error:", error)
  } finally {
    killsLeaderboardLoading.set(false)
  }
}

/**
 * Load trip leaderboard data based on current mode
 */
export async function loadTripLeaderboard() {
  const env = get(environment)
  const mode = get(tripLeaderboardMode)

  tripLeaderboardLoading.set(true)

  try {
    const response =
      mode === "active"
        ? await fetchActiveTripLeaderboard(env, LEADERBOARD_LIMIT)
        : await fetchAllTimeTripLeaderboard(env, LEADERBOARD_LIMIT)

    if (response) {
      const entries: TripLeaderboardEntry[] = response.entries.map((entry, index) => ({
        tripId: entry.id,
        tripTitle: entry.prompt || "Unnamed Trip",
        ownerName:
          entry.ownerName ||
          (entry.owner ? `${entry.owner.slice(0, 6)}...${entry.owner.slice(-4)}` : "Unknown"),
        balance: parseEthValue(entry.balance),
        rank: index + 1
      }))
      tripLeaderboard.set(entries)
    }
  } catch (error) {
    console.error("[loadTripLeaderboard] Error:", error)
  } finally {
    tripLeaderboardLoading.set(false)
  }
}

/**
 * Load all leaderboards
 */
export async function loadAllLeaderboards() {
  await Promise.all([loadRatLeaderboard(), loadKillsLeaderboard(), loadTripLeaderboard()])
}
