import { writable } from "svelte/store"
import { loadData } from "./sanity"
import type { Room as SanityRoom } from "@sanity-types"
import { queries } from "./sanity/groq"
import { getContentState } from "./state.svelte"

const { rooms: roomsState } = getContentState()

// --- TYPES ------------------------------------------------------------

export type StaticContent = {
  rooms: SanityRoom[]
}

// --- STORES -----------------------------------------------------------

export const staticContent = writable({} as StaticContent)
export const lastUpdated = writable(performance.now())

// --- API --------------------------------------------------------------

export async function initStaticContent() {
  const rooms = await loadData(queries.rooms, {})
  // State way
  roomsState.set(rooms)
  // Store way
  staticContent.set({
    rooms,
  })
}

export { urlFor } from "@modules/content/sanity"
