import { goto } from "$app/navigation"
import { playSound } from "$lib/modules/sound"
import { closeRoom } from "$lib/modules/on-chain-transactions"
import { busy } from "../index.svelte"
import { LiquidationError, RoomError } from "$lib/modules/error-handling/errors"

const DEFAULT_TIMING = 4000

/**
 * Liquidate Room
 * @param roomId The ID of the room to liquidate
 */
export async function sendLiquidateRoom(roomId: string) {
  if (busy.CloseRoom.current !== 0 || !roomId) return
  playSound("tcm", "blink")

  busy.CloseRoom.set(0.99, { duration: DEFAULT_TIMING })

  try {
    await closeRoom(roomId)
  } catch (e) {
    throw new LiquidationError(`Failed to liquidate room ${roomId}`, roomId, e)
  } finally {
    busy.CloseRoom.set(0, { duration: 0 })
    goto("/admin")
  }
}
