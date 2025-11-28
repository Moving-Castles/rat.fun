import { get } from "svelte/store"
import { publicNetwork, loadingMessage, loadingPercentage } from "$lib/modules/network"
import { SyncStep } from "@latticexyz/store-sync"

/**
 * Waits for MUD chain sync to complete.
 * Updates loading UI stores during sync progress.
 * Returns a Promise that resolves when sync reaches LIVE state.
 */
export function waitForChainSync(): Promise<void> {
  return new Promise((resolve, reject) => {
    const subscription = get(publicNetwork).components.SyncProgress.update$.subscribe(update => {
      const currentValue = update.value[0]

      if (!currentValue) {
        console.error("[Chain Sync] Sync error - no value")
        reject(new Error("Sync error"))
        subscription.unsubscribe()
        return
      }

      loadingMessage.set(currentValue.message ?? "Loading")
      loadingPercentage.set(Number(currentValue.percentage.toFixed(0) ?? 0))

      // Sync complete - resolve and clean up
      if (currentValue.step === SyncStep.LIVE) {
        console.log("[Chain Sync] Sync complete")
        subscription.unsubscribe()
        resolve()
      }
    })
  })
}
