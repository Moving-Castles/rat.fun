/**
 * Network initialization for exchange-frontend
 *
 * Initializes drawbridge for wallet connection.
 * Base mainnet only - no World contract reading needed.
 */

import { get } from "svelte/store"
import { getNetworkConfig } from "./config"
import {
  publicClient as publicClientStore,
  networkConfig as networkConfigStore,
  networkReady,
  loadingMessage
} from "./stores"
import { initializeDrawbridge, getDrawbridge } from "$lib/modules/drawbridge"

/**
 * Initialize the network
 *
 * 1. Get network config
 * 2. Initialize drawbridge (wallet connection)
 * 3. Get publicClient from drawbridge
 * 4. Mark ready
 */
export async function initNetwork(): Promise<void> {
  try {
    loadingMessage.set("Getting network config...")
    const config = getNetworkConfig()

    networkConfigStore.set(config)

    loadingMessage.set("Initializing wallet connection...")
    await initializeDrawbridge({
      chainId: config.chainId
    })

    const drawbridge = getDrawbridge()
    const client = drawbridge.getPublicClient()
    publicClientStore.set(client)

    loadingMessage.set("Ready")
    networkReady.set(true)

    console.log("[Network] Initialized:", {
      chainId: config.chainId,
      fakeRatTokenAddress: config.fakeRatTokenAddress,
      ratTokenAddress: config.ratTokenAddress,
      exchangeContractAddress: config.exchangeContractAddress
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
