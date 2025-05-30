import { writable, derived } from "svelte/store"
import type { Writable } from "svelte/store"
import type { OffChainMessage } from "@server/modules/types"
import { rat, gameConfig } from "../state/base/stores"

export const websocketConnected = writable(false)
export const clientList = writable([] as string[])
export const roundTriptime = writable(0)
export const latestEvents: Writable<OffChainMessage []> = writable([])
export const latestEventsOnRatLevel = derived([latestEvents, rat, gameConfig], ([$latestEvents, $rat, $gameConfig]) => {
  return $latestEvents.filter((event) => event.level === ($rat?.level ?? $gameConfig?.levelList[0] ?? "unknown level"))
})