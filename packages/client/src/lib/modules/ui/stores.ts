import { writable } from "svelte/store"
import { UI } from "./enums"
import { LocalStorage } from "$lib/modules/state/local.svelte"

export const UIState = writable(UI.LOADING)

// For world events, an empty prompt means that the transaction has not been made yet
//
//
export const notificationsRead = new LocalStorage("rat.fun.notifications", [])

// Session ID is used to prevent accidental double entries into rooms
export const sessionId = writable("")
