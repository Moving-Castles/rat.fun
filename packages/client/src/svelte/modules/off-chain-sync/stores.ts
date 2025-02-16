import { writable } from "svelte/store"
import type { Writable } from "svelte/store"
import { MessageContent } from "./types"

export const clientList = writable([] as string[])
export const roundTriptime = writable(0)
export const newEvent: Writable<MessageContent | null> = writable(null)
