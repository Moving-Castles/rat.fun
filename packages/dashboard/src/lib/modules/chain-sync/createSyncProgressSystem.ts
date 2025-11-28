import { get } from "svelte/store"
import { publicNetwork, ready, loadingMessage, loadingPercentage } from "$lib/modules/network"
import { SyncStep } from "@latticexyz/store-sync"

export function createSyncProgressSystem() {
  const subscription = get(publicNetwork).components.SyncProgress.update$.subscribe(update => {
    const currentValue = update.value[0]

    if (!currentValue) {
      console.error("SYNC ERROR")
      return
    }

    loadingMessage.set(currentValue.message ?? "Loading")
    loadingPercentage.set(Number(currentValue.percentage.toFixed(0) ?? 0))

    // console.log("SYNC:", update)
    // console.log("currentValue.step =>", currentValue.step)

    // || currentValue.percentage === 100
    if (currentValue.step === SyncStep.LIVE) {
      ready.set(true)
      subscription.unsubscribe()
    }
  })
}
