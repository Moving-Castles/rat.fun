import { setupPublicNetwork, type SetupPublicNetworkOptions } from "$lib/mud/setupPublicNetwork"
import { waitForChainSync } from "$lib/modules/chain-sync"
import { publicNetwork, ready, initBlockListener } from "$lib/modules/network"

export type InitPublicNetworkOptions = SetupPublicNetworkOptions

/**
 * Initialize the public network connection and wait for chain sync to complete.
 * Sets up MUD layer, waits for indexer sync, and starts block listener.
 *
 * @param options.environment - The environment to connect to
 * @param options.url - The URL (for query params like worldAddress)
 * @param options.publicClient - Optional public client from drawbridge (avoids double polling)
 */
export async function initPublicNetwork(options: InitPublicNetworkOptions) {
  const { environment, url, publicClient } = options

  // Setup MUD layer and store reference
  const mudLayer = await setupPublicNetwork({ environment, url, publicClient })
  publicNetwork.set(mudLayer)

  // Wait for chain sync to complete (updates loading UI during sync)
  await waitForChainSync()

  // Mark as ready (for any components that need to check sync status)
  ready.set(true)

  // Start listening to block updates
  initBlockListener()
}
