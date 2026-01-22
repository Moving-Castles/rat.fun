/**
 * Network initialization for auction-frontend
 *
 * Base mainnet only. Initializes drawbridge for wallet connection.
 */

import { get } from "svelte/store"
import { setupPublicBasicNetwork } from "@ratfun/common/basic-network"
import {
  publicClient as publicClientStore,
  networkConfig as networkConfigStore,
  networkReady,
  loadingMessage
} from "./stores"
import { initializeDrawbridge } from "$lib/modules/drawbridge"
import { getNetworkConfig } from "./config"

/**
 * Initialize the network
 *
 * 1. Get network config
 * 2. Initialize drawbridge (wallet connection)
 * 3. Get publicClient from drawbridge
 * 4. Set stores and mark ready
 */
export async function initNetwork(): Promise<void> {
  try {
    loadingMessage.set("Getting network config...")
    const config = getNetworkConfig()

    networkConfigStore.set(config)

    loadingMessage.set("Setting up basic public network...")
    const publicNetwork = await setupPublicBasicNetwork(config, import.meta.env.DEV)
    publicClientStore.set(publicNetwork.publicClient)

    loadingMessage.set("Initializing wallet connection...")
    await initializeDrawbridge(publicNetwork)

    loadingMessage.set("Ready")
    networkReady.set(true)

    console.log("[Network] Initialized:", {
      chainId: config.chainId
    })
  } catch (error) {
    console.error("[Network] Initialization failed:", error)
    loadingMessage.set(`Error: ${error instanceof Error ? error.message : "Unknown error"}`)
    throw error
  }
}

/**
 * Get the public client (throws if not initialized)
 */
export function getPublicClient() {
  const client = get(publicClientStore)
  if (!client) {
    throw new Error("Network not initialized")
  }
  return client
}
