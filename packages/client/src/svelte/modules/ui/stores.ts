import { writable } from "svelte/store"
import { UI, LOCATION } from "./enums"

export const UIState = writable(UI.LOADING)
export const UILocation = writable(LOCATION.NONE)
export const CurrentRoomId = writable<string | null>(null)
export const CurrentModal = writable(null)
