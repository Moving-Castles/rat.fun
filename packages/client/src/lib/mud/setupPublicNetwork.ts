/*
 * The MUD client code is built on top of viem
 * (https://viem.sh/docs/getting-started.html).
 * This line imports the functions we need from it.
 */
import { createPublicClient, fallback, webSocket, http, type Hex, type ClientConfig } from "viem"
import { syncToRecs } from "@latticexyz/store-sync/recs"

import { getNetworkConfig } from "./getNetworkConfig"
import { world } from "./world"
import { transportObserver } from "@latticexyz/common"

import { ENVIRONMENT } from "./enums"
import type { PublicClient } from "$lib/modules/drawbridge"

/*
 * Import our MUD config, which includes strong types for
 * our tables and other config options. We use this to generate
 * things like RECS components and get back strong types for them.
 *
 * See https://mud.dev/templates/typescript/contracts#mudconfigts
 * for the source of this information.
 */
import mudConfig from "contracts/mud.config"

export type SetupPublicNetworkResult = Awaited<ReturnType<typeof setupPublicNetwork>>

/**
 * Create a public client with WebSocket + HTTP fallback transports
 * Used when no external public client is provided
 */
function createPublicClientWithTransports(networkConfig: ReturnType<typeof getNetworkConfig>) {
  const transports = []

  console.log("[MUD/PublicNetwork] Setting up RPC transports:")
  console.log("  Chain:", networkConfig.chain.name, `(${networkConfig.chain.id})`)
  console.log("  HTTP RPC:", networkConfig.provider.jsonRpcUrl)
  console.log("  WebSocket RPC:", networkConfig.provider.wsRpcUrl || "not configured")
  console.log("  Environment:", import.meta.env.DEV ? "development" : "production")

  // Add WebSocket transport if WebSocket URL is available
  if (networkConfig.provider.wsRpcUrl) {
    if (import.meta.env.DEV) {
      console.log("  WebSocket disabled in development mode")
    } else {
      transports.push(webSocket(networkConfig.provider.wsRpcUrl))
      console.log("  WebSocket transport added (primary)")
    }
  } else {
    console.log("  No WebSocket URL configured, using HTTP only")
  }

  // Always add HTTP transport as fallback
  transports.push(http(networkConfig.provider.jsonRpcUrl))
  console.log("  HTTP transport added" + (transports.length > 1 ? " (fallback)" : " (primary)"))

  console.log(
    `  Final transport stack: ${transports.length === 2 ? "WebSocket -> HTTP fallback" : "HTTP only"}`
  )

  const clientOptions = {
    chain: networkConfig.chain,
    transport: transportObserver(fallback(transports)),
    pollingInterval: 2000
  } as const satisfies ClientConfig

  return createPublicClient(clientOptions)
}

export type SetupPublicNetworkOptions = {
  environment: ENVIRONMENT
  url: URL
  /**
   * Optional pre-configured public client (e.g., from drawbridge)
   * If provided, this client will be used instead of creating a new one.
   * This avoids duplicate RPC polling when using drawbridge.
   */
  publicClient?: PublicClient
}

export async function setupPublicNetwork(options: SetupPublicNetworkOptions) {
  const { environment, url, publicClient: providedPublicClient } = options
  const networkConfig = getNetworkConfig(environment, url)

  let publicClient

  if (providedPublicClient) {
    // Use the provided public client (from drawbridge)
    console.log("[MUD/PublicNetwork] Using provided public client (from drawbridge)")
    publicClient = providedPublicClient
  } else {
    // Create a new public client
    console.log("[MUD/PublicNetwork] Creating new public client")
    publicClient = createPublicClientWithTransports(networkConfig)
  }

  const resolvedConfig = {
    world,
    config: mudConfig,
    address: networkConfig.worldAddress as Hex,
    publicClient,
    startBlock: BigInt(networkConfig.initialBlockNumber),
    indexerUrl: networkConfig.indexerUrl
  }

  /*
   * Sync on-chain state into RECS and keeps our client in sync.
   * Uses the MUD indexer if available, otherwise falls back
   * to the viem publicClient to make RPC calls to fetch MUD
   * events from the chain.
   */
  const { components, latestBlock$, storedBlockLogs$, waitForTransaction } =
    await syncToRecs(resolvedConfig)

  // Allows us to to only listen to the game specific tables
  const tableKeys = [
    ...Object.keys(mudConfig.tables).map(key => key.split("__")[1]) // Strips everything before and including '__'
  ]

  return {
    config: networkConfig,
    worldAddress: networkConfig.worldAddress,
    world,
    components,
    publicClient,
    latestBlock$,
    storedBlockLogs$,
    waitForTransaction,
    tableKeys
  }
}
