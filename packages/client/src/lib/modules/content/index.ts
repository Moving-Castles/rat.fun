import { writable } from "svelte/store"
import { client, loadData } from "./sanity"
import type {
  Room as SanityRoom,
  Outcome as SanityOutcome,
  WorldEvent as SanityWorldEvent
} from "@sanity-types"
import { queries } from "./sanity/groq"

// --- TYPES ------------------------------------------------------------

export type StaticContent = {
  rooms: SanityRoom[]
  outcomes: SanityOutcome[]
  worldEvents: SanityWorldEvent[]
}

// --- STORES -----------------------------------------------------------

export const staticContent = writable({} as StaticContent)
export const lastUpdated = writable(performance.now())

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
    if (update.transition == "appear" && update.result) {
      const room = update.result as SanityRoom

      staticContent.update(content => {
        content.rooms.push(room)
        return content
      })
    }
  })

  // Subscribe to changes to outcomes in sanity DB
  client.listen(queries.outcomes, { worldAddress }).subscribe(update => {
    if (update.transition == "appear" && update.result) {
      const outcome = update.result as SanityOutcome

      staticContent.update(content => {
        content.outcomes.push(outcome)
        return content
      })
    }
  })

  // Subscribe to changes to world events in sanity DB
  client.listen(queries.worldEvents).subscribe(update => {
    if (update.transition == "appear" && update.result) {
      const worldEvent = update.result as SanityWorldEvent

      staticContent.update(content => {
        content.worldEvents.push(worldEvent)
        return content
      })
    }
  })
}
