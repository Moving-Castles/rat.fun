import { Howl } from "howler"
import { writable } from "svelte/store"

export const backgroundMusic = writable<Howl | undefined>(undefined)
