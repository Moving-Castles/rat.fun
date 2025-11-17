import {
  EntryKit,
  EntryKitStatus,
  type SessionClient,
  type EntryKitState
} from "entrykit-drawbridge"
import { readable, derived } from "svelte/store"
import { paymasters } from "./paymasters"
import { chains, transports, getConnectors } from "./wagmiConfig"
import type { Hex, Address } from "viem"
import type { NetworkConfig } from "$lib/mud/utils"

// Re-export types from package
export type { ConnectorInfo, SessionClient } from "entrykit-drawbridge"
export { EntryKitStatus } from "entrykit-drawbridge"

// EntryKit instance (singleton)
let entrykitInstance: InstanceType<typeof EntryKit> | null = null

/**
 * Initialize EntryKit - BLOCKING operation
 * Must be called once on app startup and awaited
 *
 * This will:
 * 1. Create EntryKit instance with wagmi config
 * 2. Initialize EntryKit (await reconnection, setup watchers)
 * 3. Return ready-to-use instance
 */
export async function initializeEntryKit(networkConfig: NetworkConfig): Promise<void> {
  if (entrykitInstance) {
    console.log("[EntryKit] Already initialized")
    return
  }

  console.log("[EntryKit] Creating instance with network:", networkConfig.chainId)

  // Get chain-specific config
  const chain = chains.find(c => c.id === networkConfig.chainId)
  if (!chain) {
    throw new Error(`Unsupported chain ID: ${networkConfig.chainId}`)
  }

  // Get connectors for this environment
  const connectors = getConnectors()
  console.log("[EntryKit] Connectors from getConnectors():", connectors.length)

  // Create EntryKit instance with wagmi config embedded
  entrykitInstance = new EntryKit({
    chainId: networkConfig.chainId,
    chains: [chain] as const,
    transports,
    connectors,
    worldAddress: networkConfig.worldAddress as Hex,
    paymasterClient: paymasters[networkConfig.chainId],
    pollingInterval: networkConfig.chainId === 84532 ? 2000 : undefined, // Base Sepolia = fast polling
    appName: "RAT.FUN"
  })

  // Initialize (await reconnection, setup account watcher)
  await entrykitInstance.initialize()

  console.log("[EntryKit] Instance ready")

  // Log available connectors for debugging
  const availableConnectors = entrykitInstance.getAvailableConnectors()
  console.log(
    "[EntryKit] Available connectors after init:",
    availableConnectors.length,
    availableConnectors
  )
}

/**
 * Get EntryKit instance (throws if not initialized)
 */
export function getEntryKit(): InstanceType<typeof EntryKit> {
  if (!entrykitInstance) {
    throw new Error("EntryKit not initialized. Call initializeEntryKit first.")
  }
  return entrykitInstance
}

/**
 * Cleanup EntryKit (call on app unmount)
 */
export function cleanupEntryKit(): void {
  if (entrykitInstance) {
    entrykitInstance.destroy()
    entrykitInstance = null
  }
}

// ===== Reactive Stores =====

export const entrykitState = readable<EntryKitState>(
  {
    status: EntryKitStatus.UNINITIALIZED,
    sessionClient: null,
    userAddress: null,
    sessionAddress: null,
    isReady: false
  },
  set => {
    // Subscribe when EntryKit becomes available
    const interval = setInterval(() => {
      if (entrykitInstance) {
        clearInterval(interval)
        const unsubscribe = entrykitInstance.subscribe(set)
        return unsubscribe
      }
    }, 100)

    return () => clearInterval(interval)
  }
)

// Convenience stores
export const status = derived(entrykitState, $state => $state.status)
export const sessionClient = derived<typeof entrykitState, SessionClient | null>(
  entrykitState,
  $state => $state?.sessionClient ?? null
)
export const userAddress = derived(entrykitState, $state => $state?.userAddress ?? null)
export const sessionAddress = derived(entrykitState, $state => $state?.sessionAddress ?? null)
export const isSessionReady = derived(entrykitState, $state => $state?.isReady ?? false)

// Derived store to check if session setup is needed
export const needsSessionSetup = derived(
  entrykitState,
  $state => $state.sessionClient !== null && !$state.isReady
)
