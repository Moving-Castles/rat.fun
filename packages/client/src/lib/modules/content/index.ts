import { writable, get } from "svelte/store"
import { client, loadData } from "./sanity"
import type {
  Trip as SanityTrip,
  Outcome as SanityOutcome,
  RatImages as SanityRatImages,
  TripFolder as SanityTripFolder
} from "@sanity-types"
import { queries } from "./sanity/groq"
import type { MutationEvent } from "@sanity/client"
import {
  resetTripNotifications,
  markInitialOutcomesReceived,
  handleNewOutcome,
  setPlayerIdStore
} from "./trip-notifications"

export { setPlayerIdStore }

// --- TYPES ------------------------------------------------------------

export type StaticContent = {
  ratImages: SanityRatImages
  trips: SanityTrip[]
  outcomes: SanityOutcome[]
  tripFolders: SanityTripFolder[]
  tripFolderWhitelist: string[]
}

// --- STORES -----------------------------------------------------------

export const staticContent = writable<StaticContent>({
  trips: [] as SanityTrip[],
  outcomes: [] as SanityOutcome[],
  ratImages: {} as SanityRatImages,
  tripFolders: [] as SanityTripFolder[],
  tripFolderWhitelist: [] as string[]
})

export const lastUpdated = writable(performance.now())

// --- API --------------------------------------------------------------

// Track subscriptions to avoid duplicates
let tripsSubscription: { unsubscribe: () => void } | null = null
let outcomesSubscription: { unsubscribe: () => void } | null = null

/**
 * Initialize static content from CMS (config only - no trips or outcomes).
 * Trips and outcomes are loaded separately after spawn with player-specific filtering.
 *
 * @param worldAddress - The world address to filter content by
 */
export async function initStaticContent(worldAddress: string) {
  // Reset trip notifications state before loading
  resetTripNotifications()

  const startTime = performance.now()
  const data = (await loadData(queries.staticContent, { worldAddress })) as Omit<
    StaticContent,
    "trips" | "outcomes"
  >
  const loadTime = performance.now() - startTime

  // Calculate document counts
  const counts = {
    tripFolders: data.tripFolders?.length ?? 0,
    tripFolderWhitelist: data.tripFolderWhitelist?.length ?? 0,
    hasRatImages: !!data.ratImages
  }
  const totalDocuments = counts.tripFolders + (counts.hasRatImages ? 1 : 0)

  // Log document counts for debugging/optimization
  console.log(`[CMS] Static content loaded in ${loadTime.toFixed(0)}ms:`, {
    ...counts,
    totalDocuments
  })

  staticContent.set({
    ratImages: data.ratImages,
    trips: [], // Trips loaded separately via initTrips()
    outcomes: [], // Outcomes loaded separately via initPlayerOutcomes()
    tripFolders: data.tripFolders || [],
    tripFolderWhitelist: data.tripFolderWhitelist || []
  })

  // Subscribe to changes to trip folder list in sanity DB
  client.listen(queries.tripFolderList, {}).subscribe(update => {
    const { result } = update
    if (result && result.folders) {
      staticContent.update(content => ({
        ...content,
        tripFolders: result.folders as SanityTripFolder[],
        tripFolderWhitelist: result.whitelist || []
      }))
    }
  })
}

/**
 * Initialize trips from CMS.
 * Only fetches trips that are relevant to the player:
 * - Trips with balance > 0 (active trips visible in game)
 * - Player's own trips (regardless of balance, for admin/history)
 *
 * @param worldAddress - The world address to filter content by
 * @param tripIds - Array of trip IDs to fetch (active + player's trips)
 */
export async function initTrips(worldAddress: string, tripIds: string[]) {
  // Clean up existing subscription if any
  if (tripsSubscription) {
    tripsSubscription.unsubscribe()
    tripsSubscription = null
  }

  // If no trips to load, skip
  if (tripIds.length === 0) {
    console.log("[CMS] No trips to load")
    return
  }

  const startTime = performance.now()
  const trips = (await loadData(queries.tripsForIds, {
    worldAddress,
    tripIds
  })) as SanityTrip[]
  const loadTime = performance.now() - startTime

  console.log(`[CMS] Trips loaded in ${loadTime.toFixed(0)}ms: ${trips?.length ?? 0} trips`)

  staticContent.update(content => ({
    ...content,
    trips: trips ?? []
  }))

  // Subscribe to changes to all trips in sanity DB
  tripsSubscription = client.listen(queries.trips, { worldAddress }).subscribe(update => {
    staticContent.update(content => ({
      ...content,
      trips: handleSanityUpdate<SanityTrip>(update, content.trips, (item, id) => item._id === id)
    }))
  })
}

/**
 * Initialize player-specific outcomes from CMS.
 * Only fetches outcomes for trips owned by the current player.
 *
 * @param worldAddress - The world address to filter content by
 * @param playerTripIds - Array of Sanity trip document IDs owned by the player
 */
export async function initPlayerOutcomes(worldAddress: string, playerTripIds: string[]) {
  // Clean up existing subscription if any
  if (outcomesSubscription) {
    outcomesSubscription.unsubscribe()
    outcomesSubscription = null
  }

  // If player has no trips, no outcomes to load
  if (playerTripIds.length === 0) {
    console.log("[CMS] No player trips, skipping outcomes load")
    markInitialOutcomesReceived()
    return
  }

  const startTime = performance.now()
  const outcomes = (await loadData(queries.outcomesForTripIds, {
    worldAddress,
    tripIds: playerTripIds
  })) as SanityOutcome[]
  const loadTime = performance.now() - startTime

  console.log(
    `[CMS] Player outcomes loaded in ${loadTime.toFixed(0)}ms: ${outcomes?.length ?? 0} outcomes for ${playerTripIds.length} trips`
  )

  staticContent.update(content => ({
    ...content,
    outcomes: outcomes ?? []
  }))

  // Mark initial outcomes as received so we only notify for new ones
  markInitialOutcomesReceived()

  // Subscribe to changes to all outcomes
  outcomesSubscription = client.listen(queries.outcomes, { worldAddress }).subscribe(update => {
    // Handle new outcome notifications (only for player's trips)
    if (update.transition === "appear" && update.result) {
      if (playerTripIds.includes(update.result.tripId as string)) {
        const currentContent = get(staticContent)
        handleNewOutcome(update.result as SanityOutcome, currentContent.trips)
      }
    }

    staticContent.update(content => ({
      ...content,
      outcomes: handleSanityUpdate<SanityOutcome>(
        update,
        content.outcomes,
        (item, id) => item._id === id
      )
    }))
  })
}

// --- HELPER FUNCTIONS -------------------------------------------------

function handleSanityUpdate<T>(
  update: MutationEvent<Record<string, unknown>>,
  contentArray: T[],
  findById: (item: T, id: string) => boolean
) {
  const { transition, result } = update

  if (!result) return contentArray

  switch (transition) {
    case "appear":
      // Add new item to the array
      return [...contentArray, result as T]

    case "update": {
      // Update existing item in the array
      const updatedArray = contentArray.map(item =>
        findById(item, result._id) ? (result as T) : item
      )
      // Check if anything actually changed to prevent unnecessary updates
      return contentArray.some((item, index) => item !== updatedArray[index])
        ? updatedArray
        : contentArray
    }

    case "disappear":
      // Remove item from the array
      return contentArray.filter(item => !findById(item, result._id))

    default:
      return contentArray
  }
}
