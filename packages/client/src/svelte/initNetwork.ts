import { get } from "svelte/store"
import { setupPublicNetwork } from "@mud/setupPublicNetwork"
import { createSyncProgressSystem } from "@modules/systems"
import { publicNetwork, walletNetwork, initBlockListener } from "@modules/network"
import { setupBurnerWalletNetwork } from "@mud/setupBurnerWalletNetwork"
import { ENVIRONMENT } from "@mud/enums"
import { initActionSequencer } from "@modules/action/actionSequencer"
import { playerAddress } from "@modules/state/base/stores"

export async function initNetwork(environment: ENVIRONMENT) {
    // Write mud layer to svelte store
    const mudLayer = await setupPublicNetwork(environment)
    publicNetwork.set(mudLayer)

    walletNetwork.set(setupBurnerWalletNetwork(get(publicNetwork)))
    playerAddress.set(get(walletNetwork).walletClient?.account.address)

    // Listen to changes to the SyncProgresscomponent
    createSyncProgressSystem()

    // Modules responsible for sending transactions
    initActionSequencer()

    // Write block numbers to svelte store and alert on lost connection
    initBlockListener()
}