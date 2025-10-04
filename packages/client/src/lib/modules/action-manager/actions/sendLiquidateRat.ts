import { liquidateRat } from "$lib/modules/on-chain-transactions"
import { busy } from "../index.svelte"
import { LiquidationError } from "$lib/modules/error-handling/errors"

const DEFAULT_TIMING = 4000

/**
 * Liquidate Rat
 *
 */
export async function sendLiquidateRat() {
  if (busy.LiquidateRat.current !== 0) return

  busy.LiquidateRat.set(0.99, { duration: DEFAULT_TIMING })

  try {
    await liquidateRat()
  } catch (e) {
    throw new LiquidationError("Failed to liquidate rat", undefined, e)
  } finally {
    // Add delay to prevent showing enter button before rat state updates
    setTimeout(() => {
      busy.LiquidateRat.set(0, { duration: 0 })
    }, 3000)
  }
}
