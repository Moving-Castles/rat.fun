import { sellItem } from "$lib/modules/on-chain-transactions"
import { busy } from "../index.svelte"

const DEFAULT_TIMING = 4000

/**
 * Sell Item
 * @param itemId The ID of the item to sell
 */
export async function sendSellItem(itemId: string) {
  if (busy.SellItem.current !== 0) return

  busy.SellItem.set(0.99, { duration: DEFAULT_TIMING })

  try {
    await sellItem(itemId)
  } catch (e) {
    console.error(e)
  } finally {
    busy.SellItem.set(0, { duration: 0 })
  }
}
