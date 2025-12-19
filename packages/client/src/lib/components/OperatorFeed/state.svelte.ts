import { writable, derived, get } from "svelte/store"
import type { FeedMessage, NewTripMessage, NewOutcomeMessage } from "./Feed/types"
import { FEED_MESSAGE_TYPE } from "./Feed/types"
import { environment } from "$lib/modules/network"
import {
  fetchActiveRatsLeaderboard,
  fetchCashedOutRatsLeaderboard,
  fetchActiveTripsLeaderboard,
  fetchCashedOutTripsLeaderboard,
  fetchChallengeWinners
} from "$lib/modules/query-server"
import { FEATURES } from "$lib/config/features"

const MAX_MESSAGES = 200

// Feed messages store
export const feedMessages = writable<FeedMessage[]>([])

// Active filters - when empty, all types are shown
// When populated, only checked types are shown
export const activeFilters = writable<Set<FEED_MESSAGE_TYPE>>(
  new Set([FEED_MESSAGE_TYPE.CHAT, FEED_MESSAGE_TYPE.NEW_TRIP, FEED_MESSAGE_TYPE.NEW_OUTCOME])
)

// Helper to check if a message is a challenge message
function isChallengeMessage(m: FeedMessage): boolean {
  if (m.type === FEED_MESSAGE_TYPE.NEW_TRIP) {
    return (m as NewTripMessage).isChallenge === true
  }
  if (m.type === FEED_MESSAGE_TYPE.NEW_OUTCOME) {
    return (m as NewOutcomeMessage).isChallenge === true
  }
  return false
}

// Filtered messages based on active filters
export const filteredMessages = derived([feedMessages, activeFilters], ([$messages, $filters]) => {
  // If no filters active, show nothing
  if ($filters.size === 0) return []

  // Start with messages filtered by type
  let filtered = $filters.size === 3 ? $messages : $messages.filter(m => $filters.has(m.type))

  // Filter out challenge messages when feature is disabled
  if (!FEATURES.ENABLE_CHALLENGE_TRIPS) {
    filtered = filtered.filter(m => !isChallengeMessage(m))
  }

  return filtered
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

// Leaderboard entry type (simplified)
export type LeaderboardEntry = {
  id: string
  name: string
  ownerName: string
  value: number
  rank: number
}

// Challenge winner entry type (simplified for display)
export type ChallengeWinnerDisplayEntry = {
  id: string
  name: string
  wins: number
  rank: number
}

/**
 * Parse ETH string to number, rounding to 2 decimal places
 */
function parseEthValue(ethString: string): number {
  const value = parseFloat(ethString)
  return isNaN(value) ? 0 : Math.round(value * 100) / 100
}

// Leaderboard stores for each category
export const activeRatsLeaderboard = writable<LeaderboardEntry[]>([])
export const cashedOutRatsLeaderboard = writable<LeaderboardEntry[]>([])
export const activeTripsLeaderboard = writable<LeaderboardEntry[]>([])
export const cashedOutTripsLeaderboard = writable<LeaderboardEntry[]>([])
export const challengeWinnersLeaderboard = writable<ChallengeWinnerDisplayEntry[]>([])

// Loading state (only true on initial load)
export const leaderboardsLoading = writable(false)

// Polling state
const LEADERBOARD_POLL_INTERVAL = 10000 // 10 seconds
let leaderboardPollInterval: ReturnType<typeof setInterval> | null = null
let hasLoadedOnce = false

/**
 * Check if two leaderboard arrays are equal
 */
function entriesEqual(a: LeaderboardEntry[], b: LeaderboardEntry[]): boolean {
  if (a.length !== b.length) return false
  for (let i = 0; i < a.length; i++) {
    if (a[i].id !== b[i].id || a[i].value !== b[i].value || a[i].name !== b[i].name) {
      return false
    }
  }
  return true
}

/**
 * Check if two challenge winner arrays are equal
 */
function challengeEntriesEqual(
  a: ChallengeWinnerDisplayEntry[],
  b: ChallengeWinnerDisplayEntry[]
): boolean {
  if (a.length !== b.length) return false
  for (let i = 0; i < a.length; i++) {
    if (a[i].id !== b[i].id || a[i].wins !== b[i].wins || a[i].name !== b[i].name) {
      return false
    }
  }
  return true
}

/**
 * Update store only if data has changed
 */
function updateIfChanged(
  store: typeof activeRatsLeaderboard,
  newEntries: LeaderboardEntry[]
): void {
  const current = get(store)
  if (!entriesEqual(current, newEntries)) {
    store.set(newEntries)
  }
}

/**
 * Start polling leaderboards
 */
export function startLeaderboardPolling() {
  // Load immediately
  loadAllLeaderboards()

  // Set up polling
  if (!leaderboardPollInterval) {
    leaderboardPollInterval = setInterval(() => {
      loadAllLeaderboards()
    }, LEADERBOARD_POLL_INTERVAL)
  }
}

/**
 * Stop polling leaderboards
 */
export function stopLeaderboardPolling() {
  if (leaderboardPollInterval) {
    clearInterval(leaderboardPollInterval)
    leaderboardPollInterval = null
  }
}

/**
 * Load all leaderboards
 */
export async function loadAllLeaderboards() {
  const env = get(environment)

  // Only show loading state on initial load
  if (!hasLoadedOnce) {
    leaderboardsLoading.set(true)
  }

  try {
    const [activeRats, cashedOutRats, activeTrips, cashedOutTrips, challengeWinners] =
      await Promise.all([
        fetchActiveRatsLeaderboard(env),
        fetchCashedOutRatsLeaderboard(env),
        fetchActiveTripsLeaderboard(env),
        fetchCashedOutTripsLeaderboard(env),
        fetchChallengeWinners(env)
      ])

    if (activeRats) {
      const entries = activeRats.entries.map((entry, index) => ({
        id: entry.id,
        name: entry.name || "Unnamed Rat",
        ownerName:
          entry.ownerName ||
          (entry.owner ? `${entry.owner.slice(0, 6)}...${entry.owner.slice(-4)}` : "Unknown"),
        value: parseEthValue(entry.totalValue),
        rank: index + 1
      }))
      updateIfChanged(activeRatsLeaderboard, entries)
    }

    if (cashedOutRats) {
      const entries = cashedOutRats.entries.map((entry, index) => ({
        id: entry.id,
        name: entry.name || "Unnamed Rat",
        ownerName:
          entry.ownerName ||
          (entry.owner ? `${entry.owner.slice(0, 6)}...${entry.owner.slice(-4)}` : "Unknown"),
        value: parseEthValue(entry.liquidationValue || "0"),
        rank: index + 1
      }))
      updateIfChanged(cashedOutRatsLeaderboard, entries)
    }

    if (activeTrips) {
      const entries = activeTrips.entries.map((entry, index) => ({
        id: entry.id,
        name: entry.prompt || "Unnamed Trip",
        ownerName:
          entry.ownerName ||
          (entry.owner ? `${entry.owner.slice(0, 6)}...${entry.owner.slice(-4)}` : "Unknown"),
        value: parseEthValue(entry.balance),
        rank: index + 1
      }))
      updateIfChanged(activeTripsLeaderboard, entries)
    }

    if (cashedOutTrips) {
      const entries = cashedOutTrips.entries.map((entry, index) => ({
        id: entry.id,
        name: entry.prompt || "Unnamed Trip",
        ownerName:
          entry.ownerName ||
          (entry.owner ? `${entry.owner.slice(0, 6)}...${entry.owner.slice(-4)}` : "Unknown"),
        value: parseEthValue(entry.balance),
        rank: index + 1
      }))
      updateIfChanged(cashedOutTripsLeaderboard, entries)
    }

    if (challengeWinners) {
      const entries: ChallengeWinnerDisplayEntry[] = challengeWinners.entries.map(
        (entry, index) => ({
          id: entry.player.id,
          name: entry.player.name || "Unknown",
          wins: entry.challengesWon,
          rank: index + 1
        })
      )
      const current = get(challengeWinnersLeaderboard)
      if (!challengeEntriesEqual(current, entries)) {
        challengeWinnersLeaderboard.set(entries)
      }
    }

    hasLoadedOnce = true
  } catch (error) {
    console.error("[loadAllLeaderboards] Error:", error)
  } finally {
    leaderboardsLoading.set(false)
  }
}
