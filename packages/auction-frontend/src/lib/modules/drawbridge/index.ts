import { Drawbridge, DrawbridgeStatus, PublicClient, type DrawbridgeState } from "drawbridge"
import { readable, derived } from "svelte/store"
import type { Hex, Transport } from "viem"
import { getConnectors } from "./getConnectors"

// Re-export types and enums from package
export type { ConnectorInfo } from "drawbridge"
export { DrawbridgeStatus } from "drawbridge"

/**
 * Minimal config needed for drawbridge initialization
 */
export type DrawbridgeInitConfig = {
  publicClient: PublicClient
  transport: Transport
  worldAddress?: Hex
}

// Drawbridge instance (singleton)
let drawbridgeInstance: InstanceType<typeof Drawbridge> | null = null

/**
 * Initialize Drawbridge in wallet-only mode (no session setup)
 *
 * This is a simplified version that only handles wallet connection.
 * No session accounts, no delegation, no MUD World integration.
 *
 * Use drawbridge.getWagmiConfig() to get the wagmi config for direct transactions.
 */
export async function initializeDrawbridge(config: DrawbridgeInitConfig): Promise<void> {
  if (drawbridgeInstance) {
    return
  }

  // Get connectors for this environment
  const connectors = getConnectors()

  // Create Drawbridge instance in wallet-only mode (skipSessionSetup = true)
  drawbridgeInstance = new Drawbridge({
    publicClient: config.publicClient,
    transport: config.transport,
    connectors,
    skipSessionSetup: true, // ← Wallet-only mode, no session setup
    pollingInterval: 2000,
    appName: "RAT.FUN"
  })

  // Initialize (await reconnection, setup account watcher)
  await drawbridgeInstance.initialize()
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
 * Cleanup Drawbridge (call on app unmount)
 */
export function cleanupDrawbridge(): void {
  if (drawbridgeInstance) {
    drawbridgeInstance.destroy()
    drawbridgeInstance = null
  }
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
export const userAddress = derived(drawbridgeState, $state => $state?.userAddress ?? null)

/**
 * Check if wallet is connected and ready
 * In wallet-only mode, this means status === READY (no session setup needed)
 */
export const isConnected = derived(
  drawbridgeState,
  $state => $state.status === DrawbridgeStatus.READY && $state.userAddress !== null
)
