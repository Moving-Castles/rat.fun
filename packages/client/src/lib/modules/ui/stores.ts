import { writable } from "svelte/store"
import { UI, LOCATION } from "./enums"

// Routing
export const UIState = writable(UI.LOADING)
export const UILocation = writable(LOCATION.NONE)
// Preview ID
export const previewId = writable<string | null>(null)
export const myPreviewId = writable<string | null>(null)
// Current ID
export const CurrentRoomId = writable<string | null>(null)
export const CurrentMyRoomId = writable<string | null>(null)
