import { EntryKit } from "@latticexyz/entrykit"
import { readable, derived, writable, get as getStore } from "svelte/store"
import { paymasters } from "./paymasters"
import { wagmiConfig as createWagmiConfig } from "./wagmiConfig"
import type { Hex } from "viem"
import type { Config } from "wagmi"
import type { NetworkConfig } from "$lib/mud/getNetworkConfig"

// EntryKit instance (created lazily when network config is available)
let entrykitInstance: EntryKit | null = null

// Initialize EntryKit with network config
export function initializeEntryKit(networkConfig: NetworkConfig) {
  if (entrykitInstance) {
    // Already initialized
    return entrykitInstance
  }

  console.log("[EntryKit] Initializing with network:", networkConfig.chainId)

  entrykitInstance = new EntryKit({
    chainId: networkConfig.chainId,
    worldAddress: networkConfig.worldAddress as Hex,
    paymasterClient: paymasters[networkConfig.chainId]
  })

  // Update wagmi config
  wagmiConfig.set(createWagmiConfig(networkConfig.chainId))

  return entrykitInstance
}

// Get EntryKit instance (throws if not initialized)
export function getEntryKit(): EntryKit {
  if (!entrykitInstance) {
    throw new Error("EntryKit not initialized. Call initializeEntryKit first.")
  }
  return entrykitInstance
}

// Create reactive Svelte stores
// These will be empty until EntryKit is initialized
export const entrykitState = readable<any>(
  { sessionClient: null, userAddress: null, sessionAddress: null, isReady: false },
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
export const sessionClient = derived(entrykitState, $state => $state?.sessionClient ?? null)
export const userAddress = derived(entrykitState, $state => $state?.userAddress ?? null)
export const sessionAddress = derived(entrykitState, $state => $state?.sessionAddress ?? null)
export const isSessionReady = derived(entrykitState, $state => $state?.isReady ?? false)

// Wagmi config (will be set when EntryKit initializes)
export const wagmiConfig = writable<Config | null>(null)
