import { dropItem } from "$lib/modules/on-chain-transactions"
import { busy } from "../index.svelte"

const DEFAULT_TIMING = 4000

/**
 * Drop Item
 * @param itemId The ID of the item to drop
 */
export async function sendDropItem(itemId: string) {
  if (busy.DropItem.current !== 0) return

  busy.DropItem.set(0.99, { duration: DEFAULT_TIMING })

  try {
    await dropItem(itemId)
  } catch (e) {
    console.error(e)
  } finally {
    busy.DropItem.set(0, { duration: 0 })
  }
}
