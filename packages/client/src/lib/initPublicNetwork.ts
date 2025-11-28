import { setupPublicNetwork } from "$lib/mud/setupPublicNetwork"
import { waitForChainSync } from "$lib/modules/chain-sync"
import { publicNetwork, ready, initBlockListener } from "$lib/modules/network"
import { ENVIRONMENT } from "$lib/mud/enums"

/**
 * Initialize the public network connection and wait for chain sync to complete.
 * Sets up MUD layer, waits for indexer sync, and starts block listener.
 */
export async function initPublicNetwork(environment: ENVIRONMENT, url: URL) {
  // Setup MUD layer and store reference
  const mudLayer = await setupPublicNetwork(environment, url)
  publicNetwork.set(mudLayer)

  // Wait for chain sync to complete (updates loading UI during sync)
  await waitForChainSync()

  // Mark as ready (for any components that need to check sync status)
  ready.set(true)

  // Start listening to block updates
  initBlockListener()
}
