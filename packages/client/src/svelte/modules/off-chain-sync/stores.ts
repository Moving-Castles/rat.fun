import { writable } from "svelte/store"

export const playerClientId = writable("")
export const clientList = writable([] as string[])
export const clientTransforms = writable(new Map())
export const clientLocations = writable(new Map())
