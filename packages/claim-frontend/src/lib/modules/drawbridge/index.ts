import { Drawbridge, DrawbridgeStatus, type DrawbridgeState, type PublicClient } from "drawbridge"
import { readable, derived } from "svelte/store"
import { createPublicClient, http } from "viem"
import { chains, getConnectors } from "./wagmiConfig"
import type { Hex } from "viem"

// Re-export types and enums from package
export type { ConnectorInfo } from "drawbridge"
export { DrawbridgeStatus } from "drawbridge"

/**
 * Minimal config needed for drawbridge initialization
 */
export type DrawbridgeInitConfig = {
  chainId: number
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
    console.log("[Drawbridge] Already initialized")
    return
  }

  console.log("[Drawbridge] Creating instance with network:", config.chainId)

  // Get chain-specific config
  const chain = chains.find(c => c.id === config.chainId)
  if (!chain) {
    throw new Error(`Unsupported chain ID: ${config.chainId}`)
  }

  // Create public client for the chain
  const transport = http()
  const publicClient = createPublicClient({
    chain,
    transport
  }) as PublicClient

  // Get connectors for this environment
  const connectors = getConnectors()
  console.log("[Drawbridge] Connectors from getConnectors():", connectors.length)

  // Create Drawbridge instance in wallet-only mode (skipSessionSetup = true)
  drawbridgeInstance = new Drawbridge({
    publicClient,
    transport,
    connectors,
    skipSessionSetup: true, // ← Wallet-only mode, no session setup
    pollingInterval: 2000,
    appName: "RAT.FUN"
  })

  // Initialize (await reconnection, setup account watcher)
  await drawbridgeInstance.initialize()

  console.log("[Drawbridge] Instance ready (wallet-only mode)")

  // Log available connectors for debugging
  const availableConnectors = drawbridgeInstance.getAvailableConnectors()
  console.log(
    "[Drawbridge] Available connectors after init:",
    availableConnectors.length,
    availableConnectors
  )
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
