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

// Track if we're on Firefox (has slow shader rendering)
export const isFirefox = writable(false)

// Combined check for shader performance optimization (pause after first frame)
// True on phones OR Firefox (both have slow shader rendering)
export const singleFrameRender = writable(false)

// Initialize browser checks (browser only)
if (typeof window !== "undefined") {
  // Check if Firefox
  const firefoxDetected = navigator.userAgent.toLowerCase().includes("firefox")
  isFirefox.set(firefoxDetected)

  const checkPhone = () => {
    const phoneDetected = window.innerWidth <= 800
    isPhone.set(phoneDetected)
    // Pause shaders on phones OR Firefox
    singleFrameRender.set(phoneDetected || firefoxDetected)
  }
  checkPhone()
  window.addEventListener("resize", checkPhone)
}

// Phone view state - tracks which view is active on mobile game view (ratbox or triplisting)
export const phoneActiveGameView = writable<"ratbox" | "triplisting">("ratbox")

// Phone admin view state - tracks which main view is active on mobile admin/trip-lab
export const phoneActiveAdminView = writable<"home" | "trips" | "profit" | "events">("home")

// Phone admin sub-view state - tracks sub-navigation within trips and profit views
export const adminTripsSubView = writable<"active" | "past">("active")
export const phoneAdminProfitSubView = writable<"graph" | "log">("graph")
