/**
 * Network initialization for claim-frontend
 *
 * Initializes drawbridge and reads external addresses from World contract.
 * No MUD sync - just a single RPC call to get the addresses we need.
 */

import { get } from "svelte/store"
import { resourceToHex } from "@latticexyz/common"
import type { PublicClient } from "drawbridge"
import type { Hex } from "viem"
import { getAddress, slice } from "viem"
import { getNetworkConfig, type ENVIRONMENT } from "./config"
import {
  publicClient as publicClientStore,
  worldAddress as worldAddressStore,
  networkConfig as networkConfigStore,
  externalAddresses,
  networkReady,
  loadingMessage,
  environment as environmentStore,
  type ExternalAddresses
} from "./stores"
import { initializeDrawbridge, getDrawbridge } from "$lib/modules/drawbridge"

/**
 * Table ID for ExternalAddressesConfig in the World contract
 * This is a singleton table (no key) that stores contract addresses
 */
const externalAddressesTableId = resourceToHex({
  type: "table",
  namespace: "ratfun",
  name: "ExternalAddresse" // Truncated to 16 chars by MUD
})

/**
 * ABI for MUD Store's getRecord function
 */
const storeReadRecordAbi = [
  {
    type: "function",
    name: "getRecord",
    inputs: [
      { name: "tableId", type: "bytes32" },
      { name: "keyTuple", type: "bytes32[]" }
    ],
    outputs: [
      { name: "staticData", type: "bytes" },
      { name: "encodedLengths", type: "bytes32" },
      { name: "dynamicData", type: "bytes" }
    ],
    stateMutability: "view"
  }
] as const

/**
 * Initialize the network
 *
 * 1. Get network config from environment
 * 2. Initialize drawbridge (wallet connection)
 * 3. Get publicClient from drawbridge
 * 4. Read ExternalAddressesConfig from World contract
 * 5. Set stores and mark ready
 */
export async function initNetwork(env: ENVIRONMENT, _url: URL): Promise<void> {
  try {
    loadingMessage.set("Getting network config...")
    const config = getNetworkConfig(env)

    environmentStore.set(env)
    networkConfigStore.set(config)
    worldAddressStore.set(config.worldAddress)

    loadingMessage.set("Initializing wallet connection...")
    await initializeDrawbridge({
      chainId: config.chainId,
      worldAddress: config.worldAddress
    })

    const drawbridge = getDrawbridge()
    const client = drawbridge.getPublicClient()
    publicClientStore.set(client)

    loadingMessage.set("Reading contract addresses...")
    const addresses = await readExternalAddresses(client, config.worldAddress)
    externalAddresses.set(addresses)

    loadingMessage.set("Ready")
    networkReady.set(true)

    console.log("[Network] Initialized:", {
      environment: env,
      chainId: config.chainId,
      worldAddress: config.worldAddress,
      erc20Address: addresses.erc20Address,
      gamePoolAddress: addresses.gamePoolAddress
    })
  } catch (error) {
    console.error("[Network] Initialization failed:", error)
    loadingMessage.set(`Error: ${error instanceof Error ? error.message : "Unknown error"}`)
    throw error
  }
}

/**
 * Read ExternalAddressesConfig from the World contract
 *
 * This is a single RPC call that replaces the entire MUD sync machinery.
 * Uses viem directly to call the MUD Store's getRecord function.
 *
 * The table has 5 address fields, each encoded as 20 bytes (packed) in staticData.
 * Order: erc20Address, gamePoolAddress, mainSaleAddress, serviceAddress, feeAddress
 */
async function readExternalAddresses(
  client: PublicClient,
  worldAddr: Hex
): Promise<ExternalAddresses> {
  // Call the MUD Store's getRecord function
  // Singleton table has empty keyTuple
  const result = await client.readContract({
    address: worldAddr,
    abi: storeReadRecordAbi,
    functionName: "getRecord",
    args: [externalAddressesTableId, []]
  })

  const [staticData] = result

  // Decode addresses from staticData
  // MUD packs addresses as 20 bytes each (no padding in static data)
  // Each address is 20 bytes = 40 hex chars
  const extractAddress = (offset: number): Hex => {
    // slice(data, start, end) - start and end are byte offsets
    const addressBytes = slice(staticData, offset, offset + 20)
    return getAddress(addressBytes) as Hex
  }

  return {
    erc20Address: extractAddress(0),
    gamePoolAddress: extractAddress(20),
    mainSaleAddress: extractAddress(40),
    serviceAddress: extractAddress(60),
    feeAddress: extractAddress(80)
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

/**
 * Get external addresses (throws if not initialized)
 */
export function getExternalAddresses() {
  const addresses = get(externalAddresses)
  if (!addresses) {
    throw new Error("Network not initialized")
  }
  return addresses
}
