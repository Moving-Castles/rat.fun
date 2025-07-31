import type { Account, Chain, Transport, WalletClient } from "viem"
import type { SessionClient } from "@latticexyz/entrykit/internal"
import { writable } from "svelte/store"

export const entryKitSession = writable<SessionClient<Chain> | undefined | null>(null)

export const entryKitConnector = writable<
  WalletClient<Transport, Chain, Account> | undefined | null
>(null)
