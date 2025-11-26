import { isBefore } from "date-fns"
import { writable, derived, get } from "svelte/store"
import { client, loadData } from "./sanity"
import { blockNumber } from "$lib/modules/network"
import type {
  Trip as SanityTrip,
  Outcome as SanityOutcome,
  WorldEvent as SanityWorldEvent,
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
  worldEvents: SanityWorldEvent[]
  tripFolders: SanityTripFolder[]
  tripFolderWhitelist: string[]
}

// --- STORES -----------------------------------------------------------

export const staticContent = writable<StaticContent>({
  trips: [] as SanityTrip[],
  outcomes: [] as SanityOutcome[],
  worldEvents: [] as SanityWorldEvent[],
  ratImages: {} as SanityRatImages,
  tripFolders: [] as SanityTripFolder[],
  tripFolderWhitelist: [] as string[]
})

export const lastUpdated = writable(performance.now())

export const upcomingWorldEvent = derived(
  [staticContent, blockNumber],
  ([$staticContent]: [StaticContent, bigint]) => {
    const event = $staticContent?.worldEvents?.[0]

    if (event && event?.publicationText !== "") {
      return event
    }

    return undefined
  }
)

// --- API --------------------------------------------------------------

export async function initStaticContent(worldAddress: string) {
  // Reset trip notifications state before loading
  resetTripNotifications()

  const data = (await loadData(queries.staticContent, { worldAddress })) as StaticContent

  const processedWorldEvents = data.worldEvents.filter(upcomingWorldEventFilter)

  staticContent.set({
    ratImages: data.ratImages,
    trips: data.trips,
    outcomes: data.outcomes,
    worldEvents: processedWorldEvents,
    tripFolders: data.tripFolders || [],
    tripFolderWhitelist: data.tripFolderWhitelist || []
  })

  // Mark initial outcomes as received so we only notify for new ones
  markInitialOutcomesReceived()

  // Subscribe to changes to trips in sanity DB
  client.listen(queries.trips, { worldAddress }).subscribe(update => {
    staticContent.update(content => ({
      ...content,
      trips: handleSanityUpdate<SanityTrip>(update, content.trips, (item, id) => item._id === id)
    }))
  })

  // Subscribe to changes to outcomes in sanity DB
  client.listen(queries.outcomes, { worldAddress }).subscribe(update => {
    // Handle new outcome notifications
    if (update.transition === "appear" && update.result) {
      const currentContent = get(staticContent)
      handleNewOutcome(update.result as SanityOutcome, currentContent.trips)
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

  // Subscribe to changes to world events in sanity DB
  client.listen(queries.worldEvents, { worldAddress }).subscribe(update => {
    staticContent.update(content => {
      const filteredWorldEvents = content.worldEvents.filter(upcomingWorldEventFilter)

      return {
        ...content,
        worldEvents: handleSanityUpdate<SanityWorldEvent>(
          update,
          filteredWorldEvents,
          (item, id) => item._id === id
        )
      }
    })
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

// --- HELPER FUNCTIONS -------------------------------------------------

function upcomingWorldEventFilter(e: SanityWorldEvent) {
  // If no duration is specified, filter out
  if (!e.duration) return false

  // Calculate the end timestamp for this one.
  // Duration is defined in block time ±2s per block
  const startTimeInMillis = new Date(e?.activationDateTime ?? 0)?.getTime()
  const blockTimeInMillis = e.duration * 2000

  // More dates needed for comparison
  const now = new Date()
  const endOfBlockWindow = new Date(startTimeInMillis + blockTimeInMillis)

  const endResult = isBefore(now, endOfBlockWindow)

  // If we are after the window of the event itself
  return endResult
}

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
