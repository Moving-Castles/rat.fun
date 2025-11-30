/**
 * Network stores for claim-frontend
 */

import { writable } from "svelte/store"
import type { PublicClient } from "drawbridge"
import { type NetworkConfig } from "./config"

/**
 * Network configuration (chain, addresses, etc.)
 */
export const networkConfig = writable<NetworkConfig | null>(null)

/**
 * Public client for chain reads
 */
export const publicClient = writable<PublicClient | null>(null)

/**
 * Network ready state - true when publicClient is ready
 */
export const networkReady = writable(false)

/**
 * Loading state message
 */
export const loadingMessage = writable("Initializing...")
