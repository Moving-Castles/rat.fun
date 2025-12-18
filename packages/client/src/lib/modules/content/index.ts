import { writable, get } from "svelte/store"
import { tick } from "svelte"
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
import {
  resetNewTripNotifications,
  markInitialTripsReceived,
  handleNewTrip
} from "./new-trip-notifications"
import { addFeedMessage, addFeedMessages } from "$lib/components/OperatorFeed/state.svelte"
import { FEED_MESSAGE_TYPE } from "$lib/components/OperatorFeed/Feed/types"
import type { FeedMessage, FeedItem } from "$lib/components/OperatorFeed/Feed/types"

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
  resetNewTripNotifications()

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

  // Use update instead of set to preserve any trips/outcomes that may have
  // already been loaded (race condition: initTrips can complete before this)
  staticContent.update(current => ({
    ...current,
    ratImages: data.ratImages,
    tripFolders: data.tripFolders || [],
    tripFolderWhitelist: data.tripFolderWhitelist || []
    // Don't touch trips/outcomes - they're loaded separately via initTrips()/initPlayerOutcomes()
  }))

  // Force Svelte to flush reactivity before continuing
  await tick()
  console.log("[CMS] Tick completed after static content update")

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

  staticContent.update(content => {
    console.log("[CMS] Updating staticContent.trips:", {
      before: content.trips.length,
      after: trips?.length ?? 0
    })
    return {
      ...content,
      trips: trips ?? []
    }
  })

  // Force Svelte to flush reactivity before continuing
  // This fixes a race condition where $derived values don't see store updates
  await tick()
  console.log("[CMS] Tick completed after trips update")

  // Mark initial trips as received so we only notify for new ones
  markInitialTripsReceived()

  // Subscribe to changes to all trips in sanity DB
  console.log("[CMS] Setting up Sanity trips listener...")
  tripsSubscription = client.listen(queries.trips, { worldAddress }).subscribe(update => {
    console.log("[CMS] Sanity trips listener event:", {
      transition: update.transition,
      hasResult: !!update.result,
      resultId: update.result?._id
    })

    // Handle new trip notifications
    if (update.transition === "appear" && update.result) {
      handleNewTrip(update.result as SanityTrip)
    }

    staticContent.update(content => {
      const newTrips = handleSanityUpdate<SanityTrip>(
        update,
        content.trips,
        (item, id) => item._id === id
      )
      console.log("[CMS] Sanity listener updating trips:", {
        before: content.trips.length,
        after: newTrips.length,
        transition: update.transition
      })
      return {
        ...content,
        trips: newTrips
      }
    })
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

  staticContent.update(content => {
    console.log("[CMS] Updating staticContent.outcomes:", {
      before: content.outcomes.length,
      after: outcomes?.length ?? 0
    })
    return {
      ...content,
      outcomes: outcomes ?? []
    }
  })

  // Force Svelte to flush reactivity before continuing
  await tick()
  console.log("[CMS] Tick completed after outcomes update")

  // Mark initial outcomes as received so we only notify for new ones
  markInitialOutcomesReceived()

  // Subscribe to changes to all outcomes
  console.log("[CMS] Setting up Sanity outcomes listener...")
  outcomesSubscription = client.listen(queries.outcomes, { worldAddress }).subscribe(update => {
    console.log("[CMS] Sanity outcomes listener event:", {
      transition: update.transition,
      hasResult: !!update.result,
      resultId: update.result?._id
    })
    // Handle new outcome
    if (update.transition === "appear" && update.result) {
      const outcome = update.result as SanityOutcome
      const currentContent = get(staticContent)
      const trip = currentContent.trips.find(t => t._id === outcome.tripId)

      // Add to operator feed for ALL outcomes
      const ratDied = outcome.newRatBalance === 0

      // Extract items from outcome
      const itemsOnEntrance =
        outcome.inventoryOnEntrance?.map(item => ({
          id: item.id ?? "",
          name: item.name ?? "",
          value: item.value ?? 0
        })) ?? []

      const itemsGained =
        outcome.itemChanges
          ?.filter(item => item.type === "add")
          .map(item => ({
            id: item.id ?? "",
            name: item.name ?? "",
            value: item.value ?? 0
          })) ?? []

      const itemsLost =
        outcome.itemChanges
          ?.filter(item => item.type === "remove")
          .map(item => ({
            id: item.id ?? "",
            name: item.name ?? "",
            value: item.value ?? 0
          })) ?? []

      const itemsLostOnDeath =
        outcome.itemsLostOnDeath?.map(item => ({
          id: item.id ?? "",
          name: item.name ?? "",
          value: item.value ?? 0
        })) ?? []

      addFeedMessage({
        id: `outcome-${outcome._id}-${Date.now()}`,
        type: FEED_MESSAGE_TYPE.NEW_OUTCOME,
        timestamp: Date.now(),
        tripId: outcome.tripId ?? "",
        tripIndex: outcome.tripIndex ?? trip?.index ?? 0,
        tripPrompt: trip?.prompt ?? "",
        ratName: outcome.ratName ?? "Unknown Rat",
        result: ratDied ? "died" : "survived",
        ratOwnerName: outcome.playerName ?? "Unknown Player",
        ratValueChange: outcome.ratValueChange ?? 0,
        ratBalanceChange: (outcome.newRatBalance ?? 0) - (outcome.oldRatBalance ?? 0),
        itemsOnEntrance,
        itemsGained,
        itemsLost,
        itemsLostOnDeath
      })

      // Toast notifications only for player's trips
      if (playerTripIds.includes(outcome.tripId as string)) {
        handleNewOutcome(outcome, currentContent.trips)
      }
    }

    staticContent.update(content => {
      const newOutcomes = handleSanityUpdate<SanityOutcome>(
        update,
        content.outcomes,
        (item, id) => item._id === id
      )
      console.log("[CMS] Sanity listener updating outcomes:", {
        before: content.outcomes.length,
        after: newOutcomes.length,
        transition: update.transition
      })
      return {
        ...content,
        outcomes: newOutcomes
      }
    })
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

// --- FEED HISTORY TYPES ------------------------------------------------

type RecentTripForFeed = {
  _id: string
  _createdAt: string
  index: number
  prompt: string
  ownerName: string
  creationCost: number
}

type RecentOutcomeForFeed = {
  _id: string
  _createdAt: string
  tripId: string
  tripIndex: number
  ratName: string
  playerName: string
  ratValueChange: number
  oldRatBalance: number
  newRatBalance: number
  inventoryOnEntrance?: Array<{ id?: string; name?: string; value?: number }>
  itemChanges?: Array<{ id?: string; name?: string; value?: number; type?: string }>
  itemsLostOnDeath?: Array<{ id?: string; name?: string; value?: number }>
  tripPrompt: string
}

// --- FEED HISTORY FUNCTIONS --------------------------------------------

/**
 * Load recent trips and outcomes from CMS and add them to the operator feed.
 * This populates the feed with the last 5 trips and last 5 outcomes on load.
 *
 * @param worldAddress - The world address to filter content by
 */
export async function loadFeedHistory(worldAddress: string) {
  const startTime = performance.now()

  try {
    // Fetch recent trips and outcomes in parallel
    const [recentTrips, recentOutcomes] = await Promise.all([
      loadData(queries.recentTripsForFeed, { worldAddress }) as Promise<RecentTripForFeed[]>,
      loadData(queries.recentOutcomesForFeed, { worldAddress }) as Promise<RecentOutcomeForFeed[]>
    ])

    const feedMessages: FeedMessage[] = []

    // Convert trips to feed messages
    if (recentTrips) {
      for (const trip of recentTrips) {
        feedMessages.push({
          id: `trip-history-${trip._id}`,
          type: FEED_MESSAGE_TYPE.NEW_TRIP,
          timestamp: new Date(trip._createdAt).getTime(),
          tripId: trip._id,
          tripIndex: trip.index ?? 0,
          tripPrompt: trip.prompt ?? "",
          creatorName: trip.ownerName ?? "Unknown",
          tripCreationCost: trip.creationCost ?? 0
        })
      }
    }

    // Convert outcomes to feed messages
    if (recentOutcomes) {
      for (const outcome of recentOutcomes) {
        const ratDied = outcome.newRatBalance === 0

        const itemsOnEntrance: FeedItem[] =
          outcome.inventoryOnEntrance?.map(item => ({
            id: item.id ?? "",
            name: item.name ?? "",
            value: item.value ?? 0
          })) ?? []

        const itemsGained: FeedItem[] =
          outcome.itemChanges
            ?.filter(item => item.type === "add")
            .map(item => ({
              id: item.id ?? "",
              name: item.name ?? "",
              value: item.value ?? 0
            })) ?? []

        const itemsLost: FeedItem[] =
          outcome.itemChanges
            ?.filter(item => item.type === "remove")
            .map(item => ({
              id: item.id ?? "",
              name: item.name ?? "",
              value: item.value ?? 0
            })) ?? []

        const itemsLostOnDeath: FeedItem[] =
          outcome.itemsLostOnDeath?.map(item => ({
            id: item.id ?? "",
            name: item.name ?? "",
            value: item.value ?? 0
          })) ?? []

        feedMessages.push({
          id: `outcome-history-${outcome._id}`,
          type: FEED_MESSAGE_TYPE.NEW_OUTCOME,
          timestamp: new Date(outcome._createdAt).getTime(),
          tripId: outcome.tripId ?? "",
          tripIndex: outcome.tripIndex ?? 0,
          tripPrompt: outcome.tripPrompt ?? "",
          ratName: outcome.ratName ?? "Unknown Rat",
          result: ratDied ? "died" : "survived",
          ratOwnerName: outcome.playerName ?? "Unknown Player",
          ratValueChange: outcome.ratValueChange ?? 0,
          ratBalanceChange: (outcome.newRatBalance ?? 0) - (outcome.oldRatBalance ?? 0),
          itemsOnEntrance,
          itemsGained,
          itemsLost,
          itemsLostOnDeath
        })
      }
    }

    // Add all messages at once (sorted by timestamp in addFeedMessages)
    if (feedMessages.length > 0) {
      addFeedMessages(feedMessages)
    }

    const loadTime = performance.now() - startTime
    console.log(
      `[CMS] Feed history loaded in ${loadTime.toFixed(0)}ms: ${recentTrips?.length ?? 0} trips, ${recentOutcomes?.length ?? 0} outcomes`
    )
  } catch (error) {
    console.error("[CMS] Error loading feed history:", error)
  }
}
