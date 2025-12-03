import { writable } from "svelte/store"
import type { PendingMascotMessage } from "./types"

// Store for pending mascot message
export const pendingMascotMessage = writable<PendingMascotMessage | null>(null)

// Helper functions
export function setPendingMascotMessage(msg: PendingMascotMessage) {
  pendingMascotMessage.set(msg)
}

export function clearPendingMascotMessage() {
  pendingMascotMessage.set(null)
}

// localStorage keys
const FIRST_CASHOUT_SHOWN_KEY = "ratfun_first_cashout_shown"
const ADMIN_UNLOCK_SHOWN_KEY = "ratfun_admin_unlock_shown"

// localStorage helpers
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
