import { writable } from "svelte/store"
import { UI } from "./enums"
import { LightboxState } from "$lib/modules/lightbox/lightbox.svelte"
// import { LocalStorage } from "$lib/modules/state/local.svelte"

export const UIState = writable(UI.LOADING)

// For world events, an empty prompt means that the transaction has not been made yet
// export const notificationsRead = new LocalStorage("rat.fun.notifications", [])

// For UI
export const collapsed = writable(true)
export const focusEvent = writable(-1) // Preview/hover state
export const selectedEvent = writable(-1) // Committed selection state (for flashback)
export const focusTrip = writable("")
export const lightboxState = new LightboxState()
export const selectedFolderId = writable("")

// Track if we're on a phone-sized screen (max-width: 800px)
export const isPhone = writable(false)

// Track if we're on Firefox browser
export const isFirefox = writable(false)

// Initialize isPhone and isFirefox based on window size and user agent (browser only)
if (typeof window !== "undefined") {
  const checkPhone = () => {
    isPhone.set(window.innerWidth <= 800)
  }
  checkPhone()
  window.addEventListener("resize", checkPhone)

  // Check if Firefox
  isFirefox.set(navigator.userAgent.toLowerCase().includes("firefox"))
}

// Phone view state - tracks which view is active on mobile game view (ratbox or triplisting)
export const phoneActiveGameView = writable<"ratbox" | "triplisting">("ratbox")

// Phone admin view state - tracks which main view is active on mobile admin/trips-lab
export const phoneActiveAdminView = writable<"home" | "trips" | "profit" | "events">("home")

// Phone admin sub-view state - tracks sub-navigation within trips and profit views
export const adminTripsSubView = writable<"active" | "past">("active")
export const phoneAdminProfitSubView = writable<"graph" | "log">("graph")
