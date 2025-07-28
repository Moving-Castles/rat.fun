import { writable, derived } from "svelte/store"
import { client, loadData } from "./sanity"
import { blockNumber } from "$lib/modules/network"
import type {
  Room as SanityRoom,
  Outcome as SanityOutcome,
  WorldEvent as SanityWorldEvent
} from "@sanity-types"
import { queries } from "./sanity/groq"
import type { MutationEvent } from "@sanity/client"

// --- TYPES ------------------------------------------------------------

export type StaticContent = {
  rooms: SanityRoom[]
  outcomes: SanityOutcome[]
  worldEvents: SanityWorldEvent[]
}

// --- STORES -----------------------------------------------------------

export const staticContent = writable({} as StaticContent)
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
  const rooms = await loadData(queries.rooms, { worldAddress })
  const outcomes = await loadData(queries.outcomes, { worldAddress })
  const worldEvents = await loadData(queries.worldEvents, { worldAddress })

  staticContent.set({
    rooms,
    outcomes,
    worldEvents
  })

  // Subscribe to changes to rooms in sanity DB
  client.listen(queries.rooms, { worldAddress }).subscribe(update => {
    console.log("rooms update", update)
    staticContent.update(content => ({
      ...content,
      rooms: handleSanityUpdate<SanityRoom>(update, content.rooms, (item, id) => item._id === id)
    }))
  })

  // Subscribe to changes to outcomes in sanity DB
  client.listen(queries.outcomes, { worldAddress }).subscribe(update => {
    console.log("outcomes update", update)
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
    console.log("world events update", update)
    staticContent.update(content => ({
      ...content,
      worldEvents: handleSanityUpdate<SanityWorldEvent>(
        update,
        content.worldEvents,
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
