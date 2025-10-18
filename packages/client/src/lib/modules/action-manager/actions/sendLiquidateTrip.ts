import { goto } from "$app/navigation"
import { closeTrip } from "$lib/modules/on-chain-transactions"
import { busy } from "../index.svelte"
import { LiquidationError } from "$lib/modules/error-handling/errors"

const DEFAULT_TIMING = 4000

/**
 * Liquidate Trip
 * @param tripId The ID of the trip to liquidate
 */
export async function sendLiquidateTrip(tripId: string) {
  if (busy.CloseTrip.current !== 0 || !tripId) return

  busy.CloseTrip.set(0.99, { duration: DEFAULT_TIMING })

  try {
    await closeTrip(tripId)
  } catch (e) {
    throw new LiquidationError(`Failed to liquidate trip ${tripId}`, tripId, e)
  } finally {
    busy.CloseTrip.set(0, { duration: 0 })
    goto("/cashboard")
  }
}
