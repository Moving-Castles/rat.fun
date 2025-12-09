import {
  Drawbridge,
  DrawbridgeStatus,
  type SessionClient,
  type DrawbridgeState,
  type PublicClient
} from "drawbridge"
import { readable, derived } from "svelte/store"
import type { Hex, Transport } from "viem"
import { paymasters } from "./paymasters"
import { getConnectors } from "./getConnectors"

// Re-export types from package
export type { ConnectorInfo, SessionClient, PublicClient } from "drawbridge"
export { DrawbridgeStatus } from "drawbridge"

/**
 * Minimal config needed for drawbridge initialization
 */
export type DrawbridgeInitConfig = {
  publicClient: PublicClient
  transport: Transport
  worldAddress: Hex
}

// Drawbridge instance (singleton)
let drawbridgeInstance: InstanceType<typeof Drawbridge> | null = null

/**
 * Initialize Drawbridge - BLOCKING operation
 * Must be called once on app startup and awaited
 *
 * This will:
 * 1. Create Drawbridge instance with wagmi config
 * 2. Initialize Drawbridge (await reconnection, setup watchers)
 * 3. Return ready-to-use instance
 */
export async function initializeDrawbridge(config: DrawbridgeInitConfig): Promise<void> {
  if (drawbridgeInstance) {
    // console.log("[@client/Drawbridge] Already initialized")
    return
  }

  console.log("[Drawbridge] Creating instance with network:", config.publicClient.chain.id)

  // Get connectors for this environment
  const connectors = getConnectors()
  // console.log("[@client/Drawbridge] Connectors from getConnectors():", connectors.length)

  // Create Drawbridge instance with wagmi config embedded
  drawbridgeInstance = new Drawbridge({
    publicClient: config.publicClient,
    transport: config.transport,
    connectors,
    worldAddress: config.worldAddress,
    paymasterClient: paymasters[config.publicClient.chain.id],
    pollingInterval: 2000,
    appName: "RAT.FUN",
    ethPriceUSD: 2800, // $2,800
    logging: true // Disable drawbridge console logging
  })

  // Initialize (await reconnection, setup account watcher)
  // This may fail if wallet is locked or has no accounts - that's OK, user can connect manually
  try {
    await drawbridgeInstance.initialize()
  } catch (error) {
    // Wallet errors during reconnection are non-fatal
    // Common case: wallet is locked or has no accounts (code 4001)
    console.warn("[@client/Drawbridge] Initialization warning (non-fatal):", error)
  }

  console.log("[@client/Drawbridge] Instance ready")

  // Log available connectors for debugging
  // const availableConnectors = drawbridgeInstance.getAvailableConnectors()
  // console.log(
  //   "[@client/Drawbridge] Available connectors after init:",
  //   availableConnectors.length,
  //   availableConnectors
  // )
}

/**
 * Get Drawbridge instance (throws if not initialized)
 */
export function getDrawbridge(): InstanceType<typeof Drawbridge> {
  if (!drawbridgeInstance) {
    throw new Error("Drawbridge not initialized. Call initializeDrawbridge first.")
  }
  return drawbridgeInstance
}

/**
 * Check if Drawbridge has been initialized
 */
export function isDrawbridgeInitialized(): boolean {
  return drawbridgeInstance !== null
}

/**
 * Cleanup Drawbridge (call on app unmount)
 */
export function cleanupDrawbridge(): void {
  if (drawbridgeInstance) {
    drawbridgeInstance.destroy()
    drawbridgeInstance = null
  }
}

/**
 * Get the public client from drawbridge.
 *
 * This is the single source of truth for all chain reads.
 * Use this to pass to other systems (like MUD) to avoid double RPC polling.
 *
 * @throws If drawbridge is not initialized
 */
export function getDrawbridgePublicClient(): PublicClient {
  if (!drawbridgeInstance) {
    throw new Error("Drawbridge not initialized. Call initializeDrawbridge first.")
  }

  return drawbridgeInstance.getPublicClient()
}

// ===== Reactive Stores =====

export const drawbridgeState = readable<DrawbridgeState>(
  {
    status: DrawbridgeStatus.UNINITIALIZED,
    sessionClient: null,
    userAddress: null,
    sessionAddress: null,
    isReady: false,
    error: null
  },
  set => {
    // Subscribe when Drawbridge becomes available
    const interval = setInterval(() => {
      if (drawbridgeInstance) {
        clearInterval(interval)
        const unsubscribe = drawbridgeInstance.subscribe(set)
        return unsubscribe
      }
    }, 100)

    return () => clearInterval(interval)
  }
)

// Convenience stores
export const status = derived(drawbridgeState, $state => $state.status)
export const sessionClient = derived<typeof drawbridgeState, SessionClient | null>(
  drawbridgeState,
  $state => $state?.sessionClient ?? null
)
export const userAddress = derived(drawbridgeState, $state => $state?.userAddress ?? null)
export const sessionAddress = derived(drawbridgeState, $state => $state?.sessionAddress ?? null)
export const isSessionReady = derived(drawbridgeState, $state => $state?.isReady ?? false)
export const drawbridgeError = derived(drawbridgeState, $state => $state?.error ?? null)

// Derived store to check if session setup is needed
export const needsSessionSetup = derived(
  drawbridgeState,
  $state => $state.sessionClient !== null && !$state.isReady
)
