import { setupPublicNetwork } from "$lib/mud/setupPublicNetwork"
import { createSyncProgressSystem } from "$lib/modules/systems"
import { publicNetwork, initBlockListener } from "$lib/modules/network"
import { ENVIRONMENT } from "$lib/mud/enums"

export async function initPublicNetwork(environment: ENVIRONMENT, url: URL) {
  // Write mud layer to svelte store
  const mudLayer = await setupPublicNetwork(environment, url)

  publicNetwork.set(mudLayer)

  // Listen to changes to the SyncProgress component
  createSyncProgressSystem()

  // Write block numbers to svelte store and alert on lost connection
  initBlockListener()
}
