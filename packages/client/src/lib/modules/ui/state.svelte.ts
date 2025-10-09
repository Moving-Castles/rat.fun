import { writable } from "svelte/store"
import { UI } from "./enums"
import { LocalStorage } from "$lib/modules/state/local.svelte"

export const UIState = writable(UI.LOADING)

// For world events, an empty prompt means that the transaction has not been made yet
export const notificationsRead = new LocalStorage("rat.fun.notifications", [])

// For UI
export const collapsed = writable(true)

export const adminUnlockedAt = writable(-1)

export const focusEvent = writable(-1)
