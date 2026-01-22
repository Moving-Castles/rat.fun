/**
 * Network stores for auction-frontend
 */

import { writable } from "svelte/store"
import type { PublicClient } from "drawbridge"
import { BasicNetworkConfig } from "@ratfun/common/basic-network"

/**
 * Network configuration (chain, chainId)
 */
export const networkConfig = writable<BasicNetworkConfig | null>(null)

/**
 * Public client for chain reads
 */
export const publicClient = writable<PublicClient | null>(null)

/**
 * Network ready state - true when publicClient is loaded
 */
export const networkReady = writable(false)

/**
 * Loading state
 */
export const loadingMessage = writable("Initializing...")
