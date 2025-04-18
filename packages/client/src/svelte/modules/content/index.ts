import { writable } from "svelte/store"
import { loadData } from "./sanity"
import type { Room as SanityRoom } from "@sanity-types"
import { queries } from "./sanity/groq"

// --- TYPES ------------------------------------------------------------

export type StaticContent = {
  rooms: SanityRoom[]
}

// --- STORES -----------------------------------------------------------

export const staticContent = writable({} as StaticContent)

// --- API --------------------------------------------------------------

export async function initStaticContent() {
  const rooms = await loadData(queries.rooms, {})
  staticContent.set({
    rooms,
  })
}
