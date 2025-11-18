import { writable } from "svelte/store"
import { UI } from "./enums"
// import { LocalStorage } from "$lib/modules/state/local.svelte"

export const UIState = writable(UI.LOADING)

// Track if we're on a phone-sized screen (max-width: 800px)
export const isPhone = writable(false)

// Initialize isPhone based on window size (browser only)
if (typeof window !== "undefined") {
  const checkPhone = () => {
    isPhone.set(window.innerWidth <= 800)
  }
  checkPhone()
  window.addEventListener("resize", checkPhone)
}
