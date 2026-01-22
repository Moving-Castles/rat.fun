import { writable } from "svelte/store"
import { UI } from "./enums"
// import { LocalStorage } from "$lib/modules/state/local.svelte"

export const UIState = writable(UI.LOADING)

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
