import { setupPublicNetwork } from "$lib/mud/setupPublicNetwork"
import { createSyncProgressSystem } from "$lib/modules/systems"
import { publicNetwork, initBlockListener } from "$lib/modules/network"
import { ENVIRONMENT } from "$lib/mud/enums"

export async function initPublicNetwork(environment: ENVIRONMENT) {
    // Write mud layer to svelte store
    const mudLayer = await setupPublicNetwork(environment)
    publicNetwork.set(mudLayer)

    // Listen to changes to the SyncProgresscomponent
    createSyncProgressSystem()

    // Write block numbers to svelte store and alert on lost connection
    initBlockListener()
}