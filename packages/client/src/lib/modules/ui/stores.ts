import { writable } from "svelte/store"
import { UI } from "./enums"

export const UIState = writable(UI.LOADING)
