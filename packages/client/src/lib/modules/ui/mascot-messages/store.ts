import { writable } from "svelte/store"
import type { PendingMascotMessage } from "./types"

// Store for pending mascot message
export const pendingMascotMessage = writable<PendingMascotMessage | null>(null)

// Store for the name of the last dead rat (in-memory only, no persistence)
export const lastDeadRatName = writable<string | null>(null)

export function setLastDeadRatName(name: string) {
  lastDeadRatName.set(name)
}

// Helper functions
export function setPendingMascotMessage(msg: PendingMascotMessage) {
  pendingMascotMessage.set(msg)
}

export function clearPendingMascotMessage() {
  pendingMascotMessage.set(null)
}

// localStorage keys
const NEW_PLAYER_SHOWN_KEY = "ratfun_new_player_shown"
const FIRST_DEATH_SHOWN_KEY = "ratfun_first_death_shown"
const FIRST_CASHOUT_SHOWN_KEY = "ratfun_first_cashout_shown"
const ADMIN_UNLOCK_SHOWN_KEY = "ratfun_admin_unlock_shown"

// localStorage helpers
export function isNewPlayerShown(): boolean {
  if (typeof localStorage === "undefined") return false
  return localStorage.getItem(NEW_PLAYER_SHOWN_KEY) === "true"
}

export function setNewPlayerShown() {
  if (typeof localStorage === "undefined") return
  localStorage.setItem(NEW_PLAYER_SHOWN_KEY, "true")
}

export function isFirstDeathShown(): boolean {
  if (typeof localStorage === "undefined") return false
  return localStorage.getItem(FIRST_DEATH_SHOWN_KEY) === "true"
}

export function setFirstDeathShown() {
  if (typeof localStorage === "undefined") return
  localStorage.setItem(FIRST_DEATH_SHOWN_KEY, "true")
}

export function isFirstCashoutShown(): boolean {
  if (typeof localStorage === "undefined") return false
  return localStorage.getItem(FIRST_CASHOUT_SHOWN_KEY) === "true"
}

export function setFirstCashoutShown() {
  if (typeof localStorage === "undefined") return
  localStorage.setItem(FIRST_CASHOUT_SHOWN_KEY, "true")
}

export function isAdminUnlockShown(): boolean {
  if (typeof localStorage === "undefined") return false
  return localStorage.getItem(ADMIN_UNLOCK_SHOWN_KEY) === "true"
}

export function setAdminUnlockShown() {
  if (typeof localStorage === "undefined") return
  localStorage.setItem(ADMIN_UNLOCK_SHOWN_KEY, "true")
}
