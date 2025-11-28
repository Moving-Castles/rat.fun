import { get } from "svelte/store"
import { publicNetwork, ready, loadingMessage, loadingPercentage } from "$lib/modules/network"
import { SyncStep } from "@latticexyz/store-sync"

/**
 * Monitors MUD sync progress and updates loading UI stores.
 * Automatically unsubscribes when sync reaches LIVE state.
 */
export function createSyncProgressSystem() {
  const subscription = get(publicNetwork).components.SyncProgress.update$.subscribe(update => {
    const currentValue = update.value[0]

    if (!currentValue) {
      console.error("SYNC ERROR")
      return
    }

    loadingMessage.set(currentValue.message ?? "Loading")
    loadingPercentage.set(Number(currentValue.percentage.toFixed(0) ?? 0))

    // Sync complete - mark as ready and clean up
    if (currentValue.step === SyncStep.LIVE) {
      ready.set(true)
      subscription.unsubscribe()
    }
  })
}
