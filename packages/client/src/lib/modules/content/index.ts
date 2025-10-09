import { isBefore } from "date-fns"
import { writable, derived } from "svelte/store"
import { client, loadData } from "./sanity"
import { blockNumber } from "$lib/modules/network"
import type {
  Trip as SanityTrip,
  Outcome as SanityOutcome,
  WorldEvent as SanityWorldEvent
} from "@sanity-types"
import { queries } from "./sanity/groq"
import type { MutationEvent } from "@sanity/client"

// --- TYPES ------------------------------------------------------------

export type StaticContent = {
  trips: SanityTrip[]
  outcomes: SanityOutcome[]
  worldEvents: SanityWorldEvent[]
}

// --- STORES -----------------------------------------------------------

export const staticContent = writable<StaticContent>({ trips: [], outcomes: [], worldEvents: [] })
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
  const trips = await loadData(queries.trips, { worldAddress })
  const outcomes = await loadData(queries.outcomes, { worldAddress })
  const worldEvents = await loadData(queries.worldEvents, { worldAddress })

  const processedWorldEvents = worldEvents.filter(upcomingWorldEventFilter)

  staticContent.set({
    trips,
    outcomes,
    worldEvents: processedWorldEvents
  })

  // Subscribe to changes to trips in sanity DB
  client.listen(queries.trips, { worldAddress }).subscribe(update => {
    staticContent.update(content => ({
      ...content,
      trips: handleSanityUpdate<SanityTrip>(update, content.trips, (item, id) => item._id === id)
    }))
  })

  // Subscribe to changes to outcomes in sanity DB
  client.listen(queries.outcomes, { worldAddress }).subscribe(update => {
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
