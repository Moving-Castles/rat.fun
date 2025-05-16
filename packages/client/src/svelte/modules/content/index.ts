import { writable } from "svelte/store"
import { client, loadData } from "./sanity"
import type { Room as SanityRoom } from "@sanity-types"
import { queries } from "./sanity/groq"

// --- TYPES ------------------------------------------------------------

export type StaticContent = {
  rooms: SanityRoom[]
}

// --- STORES -----------------------------------------------------------

export const staticContent = writable({} as StaticContent)
export const lastUpdated = writable(performance.now())

// --- API --------------------------------------------------------------

export async function initStaticContent(worldAddress: string) {
  const rooms = await loadData(queries.rooms, { worldAddress })
  staticContent.set({
    rooms,
  })

  // Subscribe to changes to rooms in sanity DB
  client.listen(queries.rooms, { worldAddress }).subscribe(update => {
    if (update.transition == "appear" && update.result) {
      const room = update.result as SanityRoom
      console.log("new room", room)
      staticContent.update(content => {
        content.rooms.push(room)
        return content
      })
    }
  })
}