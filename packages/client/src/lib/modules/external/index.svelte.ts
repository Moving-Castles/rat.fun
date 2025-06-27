import { get } from "svelte/store"
import { Tween } from "svelte/motion"
import { cubicOut as easing } from "svelte/easing"
import { getEnvironment } from "$lib/modules/network"
import { playSound } from "$lib/modules/sound"
import { goto } from "$app/navigation"
import { gameConfig, playerERC20Allowance } from "$lib/modules/state/base/stores"
import {
  spawn,
  createRat,
  liquidateRat,
  dropItem,
  closeRoom,
  approve,
  approveMax,
  giveCallerTokens
} from "$lib/modules/action"

import { waitForCompletion } from "$lib/modules/action/actionSequencer/utils"
import { createRoom } from "$lib/components/Landlord/CreateRoom"

const DEFAULT_TIMINGS = {
  CreateRoom: 6000,
  CloseRoom: 6000,
  CreateRat: 10000,
  DropItem: 1000,
  GiveCallerTokens: 1000,
  LiquidateRat: 2000,
  Spawn: 1000
}

export const busy = $state({
  CreateRoom: new Tween(0, { duration: DEFAULT_TIMINGS.CreateRoom, easing }),
  CloseRoom: new Tween(0, { duration: DEFAULT_TIMINGS.CloseRoom, easing }),
  CreateRat: new Tween(0, { duration: DEFAULT_TIMINGS.CreateRat, easing }),
  DropItem: new Tween(0, { duration: DEFAULT_TIMINGS.DropItem, easing }),
  GiveCallerTokens: new Tween(0, { duration: DEFAULT_TIMINGS.GiveCallerTokens, easing }),
  LiquidateRat: new Tween(0, { duration: DEFAULT_TIMINGS.LiquidateRat, easing }),
  Spawn: new Tween(0, { duration: DEFAULT_TIMINGS.Spawn, easing })
})

/** Create room
 *
 *
 */
export async function sendCreateRoom(newPrompt: string, levelId: string, roomCreationCost: bigint) {
  const env = getEnvironment(new URL(window.location.href))
  const _gameConfig = get(gameConfig)
  const _playerERC20Allowance = get(playerERC20Allowance)

  if (busy.CreateRoom.current !== 0) return
  busy.CreateRoom.set(0.99, { duration: DEFAULT_TIMINGS.CreateRoom })

  // Approve
  try {
    if (_playerERC20Allowance < _gameConfig.gameConfig.roomCreationCost) {
      const approveAction = approve(
        _gameConfig.externalAddressesConfig.gamePoolAddress,
        roomCreationCost
      )
      await waitForCompletion(approveAction)
    }
  } catch (e) {
    console.error(e)
    throw new Error(e)
  } finally {
    busy.CreateRoom.set(0, { duration: 0 })
  }

  // Do the thing
  try {
    const result = await createRoom(env, newPrompt, levelId)

    if (result.roomId) {
      goto(`/landlord/${result.roomId}`)
    }
  } catch (e) {
    console.error(e)
    throw new Error(e)
  } finally {
    busy.CreateRoom.set(0, { duration: 0 })
  }
}

/** Create rat
 *
 *
 */
export async function sendCreateRat(name: string) {
  const _gameConfig = get(gameConfig)
  const _playerERC20Allowance = get(playerERC20Allowance)

  if (busy.CreateRat.current !== 0) return
  playSound("tcm", "blink")
  busy.CreateRat.set(0.99)
  // Approve
  try {
    if (_playerERC20Allowance < _gameConfig.gameConfig.ratCreationCost) {
      const approveAction = approve(
        _gameConfig.externalAddressesConfig.gamePoolAddress,
        _gameConfig.gameConfig.ratCreationCost
      )
      await waitForCompletion(approveAction)
    }
    // Do the thing
    const createRatAction = createRat(name)
    await waitForCompletion(createRatAction)
  } catch (e) {
    console.error(e)
    throw new Error(e)
  } finally {
    busy.CreateRat.set(0, { duration: 0 })
    busy.CreateRat.set(0, { duration: DEFAULT_TIMINGS.CreateRat })
  }
}

/** Spawn
 *
 *
 */
export async function sendSpawn(name: string) {
  if (busy.Spawn.current !== 0 || !name) return

  playSound("tcm", "blink")
  busy.Spawn.set(0.99, { duration: DEFAULT_TIMINGS.Spawn }) // we never get to 1

  try {
    const spawnAction = spawn(name)
    await waitForCompletion(spawnAction)
  } catch (e) {
    throw new Error(e)
  } finally {
    busy.Spawn.set(0, { duration: 0 })
  }
}

/**
 * Liquidate Rat
 *
 *
 */
export async function sendLiquidateRat() {
  if (busy.LiquidateRat.current !== 0) return

  playSound("tcm", "ratScream")
  busy.LiquidateRat.set(0.99, { duration: DEFAULT_TIMINGS.LiquidateRat })

  const action = liquidateRat()

  try {
    await waitForCompletion(action)
  } catch (e) {
    busy.LiquidateRat.set(0, { duration: 0 })
    console.error(e)
  }
}

/**
 * Liquidate Room
 *
 *
 */
export async function sendLiquidateRoom(roomId: string) {
  if (busy.CloseRoom.current !== 0 || !roomId) return
  playSound("tcm", "blink")

  busy.CloseRoom.set(0.99, { duration: DEFAULT_TIMINGS.CloseRoom })
  const action = closeRoom(roomId)

  try {
    await waitForCompletion(action)
  } catch (e) {
    throw new Error(e)
  } finally {
    goto("/landlord")
    busy.CloseRoom.set(0, { duration: 0 })
  }
}
