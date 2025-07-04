import { giveCallerTokens } from "$lib/modules/on-chain-transactions"
import { busy } from "../index.svelte"

const DEFAULT_TIMING = 4000

/**
 * Give caller tokens
 *
 */
export async function sendGiveCallerTokens() {
  if (busy.GiveCallerTokens.current !== 0) return
  busy.GiveCallerTokens.set(0.99, { duration: DEFAULT_TIMING })

  try {
    await giveCallerTokens()
  } catch (e) {
    console.error(e)
  } finally {
    busy.GiveCallerTokens.set(0, { duration: 0 })
  }
}
