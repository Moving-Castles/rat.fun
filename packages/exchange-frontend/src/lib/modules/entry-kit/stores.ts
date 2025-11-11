import type { Chain } from "viem"
import { Config } from "wagmi"
import type { SessionClient } from "@latticexyz/entrykit/internal"
import { writable } from "svelte/store"

export const entryKitSession = writable<SessionClient<Chain> | undefined | null>(null)
export const wagmiConfigStateful = writable<Config | null>(null)
export const entryKitButton = writable<HTMLElement | null>(null)
