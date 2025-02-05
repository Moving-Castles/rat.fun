import { writable } from "svelte/store"
import type { Writable } from "svelte/store"
import { ServerReturnValuePvP } from "@components/Nest/types"

export const clientList = writable([] as string[])
export const newEvent: Writable<ServerReturnValuePvP | null> = writable(null)
