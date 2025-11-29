/**
 * Network stores for auction-frontend
 *
 * Simple stores for network state - no MUD complexity.
 */

import { writable } from "svelte/store"
import type { PublicClient } from "drawbridge"
import type { Hex } from "viem"
import { ENVIRONMENT, type NetworkConfig } from "./config"

/**
 * Current environment
 */
export const environment = writable<ENVIRONMENT>(ENVIRONMENT.UNKNOWN)

/**
 * Network configuration (chain, chainId, rpcUrl, etc.)
 */
export const networkConfig = writable<NetworkConfig | null>(null)

/**
 * Public client for chain reads
 */
export const publicClient = writable<PublicClient | null>(null)

/**
 * World contract address
 */
export const worldAddress = writable<Hex | null>(null)

/**
 * External addresses from World contract
 */
export type ExternalAddresses = {
  erc20Address: Hex
  gamePoolAddress: Hex
  mainSaleAddress: Hex
  serviceAddress: Hex
  feeAddress: Hex
}

export const externalAddresses = writable<ExternalAddresses | null>(null)

/**
 * Network ready state - true when publicClient and externalAddresses are loaded
 */
export const networkReady = writable(false)

/**
 * Loading state
 */
export const loadingMessage = writable("Initializing...")
