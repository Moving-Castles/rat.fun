import { playSound } from "$lib/modules/sound"
import { liquidateRat } from "$lib/modules/on-chain-transactions"
import { busy } from "../index.svelte"
import { LiquidationError, RatError } from "$lib/modules/error-handling/errors"

const DEFAULT_TIMING = 4000

/**
 * Liquidate Rat
 *
 */
export async function sendLiquidateRat() {
  if (busy.LiquidateRat.current !== 0) return

  playSound("tcm", "ratScream")
  busy.LiquidateRat.set(0.99, { duration: DEFAULT_TIMING })

  try {
    await liquidateRat()
  } catch (e) {
    throw new LiquidationError("Failed to liquidate rat", undefined, e)
  } finally {
    busy.LiquidateRat.set(0, { duration: 0 })
  }
}
