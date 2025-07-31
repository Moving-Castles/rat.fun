import { reAbsorbItem } from "$lib/modules/on-chain-transactions"
import { busy } from "../index.svelte"
import { TransactionError } from "$lib/modules/error-handling/errors"

const DEFAULT_TIMING = 4000

/**
 * Sell Item
 * @param itemId The ID of the item to sell
 */
export async function sendReAbsorbItem(itemId: string) {
  if (busy.ReAbsorbItem.current !== 0) return

  busy.ReAbsorbItem.set(0.99, { duration: DEFAULT_TIMING })

  try {
    await reAbsorbItem(itemId)
  } catch (e) {
    throw new TransactionError(`Failed to re-absorb item ${itemId}`, e)
  } finally {
    busy.ReAbsorbItem.set(0, { duration: 0 })
  }
}
