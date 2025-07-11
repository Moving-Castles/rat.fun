import type { Chain } from "viem"
import type { SessionClient } from "@latticexyz/entrykit/internal"
import { writable } from "svelte/store"

export const entryKitSession = writable<SessionClient<Chain> | undefined | null>(null)
