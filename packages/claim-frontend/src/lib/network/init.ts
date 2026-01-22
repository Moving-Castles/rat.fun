/**
 * Network initialization for claim-frontend
 *
 * Initializes drawbridge (wallet connection) and sets up the public client.
 * Contract addresses come from environment variables.
 */

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
 * 1. Get network config (chain + addresses from env)
 * 2. Initialize drawbridge (wallet connection)
 * 3. Get publicClient from drawbridge
 * 4. Set stores and mark ready
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
      ratTokenAddress: config.ratTokenAddress,
      airdropContractAddress: config.airdropContractAddress
    })
  } catch (error) {
    console.error("[Network] Initialization failed:", error)
    loadingMessage.set(`Error: ${error instanceof Error ? error.message : "Unknown error"}`)
    throw error
  }
}
