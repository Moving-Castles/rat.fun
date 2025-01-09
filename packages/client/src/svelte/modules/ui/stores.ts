import { writable } from "svelte/store"
import { UI, LOCATION } from "./enums"
export const UIState = writable(UI.LOADING)
export const UILocation = writable(LOCATION.TOWN)
