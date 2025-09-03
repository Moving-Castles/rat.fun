import { writable } from "svelte/store"
import type { Writable } from "svelte/store"
import type { OffChainMessage } from "@server/modules/types"

export const websocketConnected = writable(false)
export const clientList = writable([] as string[])
export const roundTriptime = writable(0)
export const latestEvents: Writable<OffChainMessage[]> = writable([])
