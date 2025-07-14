import { get } from "svelte/store"
import { publicNetwork, ready, loadingMessage } from "$lib/modules/network"
import { SyncStep } from "@latticexyz/store-sync"

export function createSyncProgressSystem() {
  const subscription = get(publicNetwork).components.SyncProgress.update$.subscribe(update => {
    loadingMessage.set(
      `${update.value[0]?.message} ${String(update.value[0]?.percentage.toFixed(0))}`
    )

    if (update.value[0]?.step === SyncStep.LIVE) {
      // Data loaded from indexer
      ready.set(true)

      subscription.unsubscribe()
    }
  })
}
