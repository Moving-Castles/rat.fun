import { EntryKit, EntryKitStatus, type EntryKitState } from "entrykit-drawbridge"
import { readable, derived } from "svelte/store"
import { chains, transports, getConnectors } from "./wagmiConfig"
import type { Address } from "viem"
import type { NetworkConfig } from "$lib/mud/utils"

// Re-export types and enums from package
export type { ConnectorInfo } from "entrykit-drawbridge"
export { EntryKitStatus } from "entrykit-drawbridge"

// EntryKit instance (singleton)
let entrykitInstance: InstanceType<typeof EntryKit> | null = null

/**
 * Initialize EntryKit in wallet-only mode (no session setup)
 *
 * This is a simplified version for claim-frontend that only handles wallet connection.
 * No session accounts, no delegation, no MUD World integration.
 *
 * Use entrykit.getWagmiConfig() to get the wagmi config for direct transactions.
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

  // Create EntryKit instance in wallet-only mode (skipSessionSetup = true)
  entrykitInstance = new EntryKit({
    chainId: networkConfig.chainId,
    chains: [chain] as const,
    transports,
    connectors,
    skipSessionSetup: true, // ← Wallet-only mode, no session setup
    pollingInterval: networkConfig.chainId === 84532 ? 2000 : undefined, // Base Sepolia = fast polling
    appName: "RAT.FUN"
  })

  // Initialize (await reconnection, setup account watcher)
  await entrykitInstance.initialize()

  console.log("[EntryKit] Instance ready (wallet-only mode)")

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
export const userAddress = derived(entrykitState, $state => $state?.userAddress ?? null)

/**
 * Check if wallet is connected and ready
 * In wallet-only mode, this means status === READY (no session setup needed)
 */
export const isConnected = derived(
  entrykitState,
  $state => $state.status === EntryKitStatus.READY && $state.userAddress !== null
)
