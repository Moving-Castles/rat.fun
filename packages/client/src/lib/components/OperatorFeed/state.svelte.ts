import { writable, derived } from "svelte/store"
import type { FeedMessage } from "./Feed/types"
import { FEED_MESSAGE_TYPE } from "./Feed/types"

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

// Leaderboard types
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

// Leaderboard stores (empty for now, will be populated when data loading is implemented)
export const ratLeaderboard = writable<RatLeaderboardEntry[]>([])
export const killsLeaderboard = writable<KillsLeaderboardEntry[]>([])
export const tripLeaderboard = writable<TripLeaderboardEntry[]>([])

export const ratLeaderboardMode = writable<"alive" | "all_time">("alive")
export const tripLeaderboardMode = writable<"active" | "all_time">("active")
