import type { Chain } from "viem"
import type { SessionClient } from "@latticexyz/entrykit/internal"
import { writable } from "svelte/store"
import { GetConnectorClientData } from "wagmi/query"
import { Config } from "wagmi"

export const entryKitSession = writable<SessionClient<Chain> | undefined | null>(null)

export const entryKitConnector = writable<
  GetConnectorClientData<Config, number> | undefined | null
>(null)
