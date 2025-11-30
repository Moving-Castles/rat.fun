/**
 * Network stores for exchange-frontend
 */

import { writable } from "svelte/store"
import type { PublicClient } from "drawbridge"
import type { NetworkConfig } from "./config"

/**
 * Network configuration (chain, chainId, rpcUrl, addresses)
 */
export const networkConfig = writable<NetworkConfig | null>(null)

/**
 * Public client for chain reads
 */
export const publicClient = writable<PublicClient | null>(null)

/**
 * Network ready state - true when publicClient is initialized
 */
export const networkReady = writable(false)

/**
 * Loading state
 */
export const loadingMessage = writable("Initializing...")
