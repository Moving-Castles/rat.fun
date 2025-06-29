import { get } from "svelte/store"
import { Tween } from "svelte/motion"
import { cubicOut as easing } from "svelte/easing"
import { getEnvironment } from "$lib/modules/network"
import { playSound } from "$lib/modules/sound"
import { goto } from "$app/navigation"
import { gameConfig, playerERC20Allowance } from "$lib/modules/state/base/stores"
import { spawn, createRat, liquidateRat, closeRoom, approve } from "$lib/modules/on-chain-action"
import { createRoom } from "$lib/components/Landlord/CreateRoom"

const DEFAULT_TIMINGS = {
  CreateRoom: 4000,
  EnterRoom: 4000,
  CloseRoom: 4000,
  CreateRat: 4000,
  DropItem: 4000,
  GiveCallerTokens: 4000,
  LiquidateRat: 2000,
  Spawn: 1000
}

export const busy = $state({
  CreateRoom: new Tween(0, { duration: DEFAULT_TIMINGS.CreateRoom, easing }),
  EnterRoom: new Tween(0, { duration: DEFAULT_TIMINGS.EnterRoom, easing }),
  CloseRoom: new Tween(0, { duration: DEFAULT_TIMINGS.CloseRoom, easing }),
  CreateRat: new Tween(0, { duration: DEFAULT_TIMINGS.CreateRat, easing }),
  DropItem: new Tween(0, { duration: DEFAULT_TIMINGS.DropItem, easing }),
  GiveCallerTokens: new Tween(0, { duration: DEFAULT_TIMINGS.GiveCallerTokens, easing }),
  LiquidateRat: new Tween(0, { duration: DEFAULT_TIMINGS.LiquidateRat, easing }),
  Spawn: new Tween(0, { duration: DEFAULT_TIMINGS.Spawn, easing })
})

/**
 * Create room
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
      await approve(_gameConfig.externalAddressesConfig.gamePoolAddress, roomCreationCost)
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

/**
 * Enter room
 *
 */
export async function sendEnterRoom(roomId: string) {
  if (busy.EnterRoom.current !== 0) return
  busy.EnterRoom.set(0.99, { duration: DEFAULT_TIMINGS.EnterRoom })
}

/**
 * Create rat
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
      await approve(
        _gameConfig.externalAddressesConfig.gamePoolAddress,
        _gameConfig.gameConfig.ratCreationCost
      )
    }
    // Do the thing
    await createRat(name)
  } catch (e) {
    console.error(e)
    throw new Error(e)
  } finally {
    busy.CreateRat.set(0, { duration: 0 })
    busy.CreateRat.set(0, { duration: DEFAULT_TIMINGS.CreateRat })
  }
}

/**
 * Spawn
 *
 */
export async function sendSpawn(name: string) {
  if (busy.Spawn.current !== 0 || !name) return

  playSound("tcm", "blink")
  busy.Spawn.set(0.99, { duration: DEFAULT_TIMINGS.Spawn }) // we never get to 1

  try {
    await spawn(name)
  } catch (e) {
    throw new Error(e)
  } finally {
    busy.Spawn.set(0, { duration: 0 })
  }
}

/**
 * Liquidate Rat
 *
 */
export async function sendLiquidateRat() {
  if (busy.LiquidateRat.current !== 0) return

  playSound("tcm", "ratScream")
  busy.LiquidateRat.set(0.99, { duration: DEFAULT_TIMINGS.LiquidateRat })

  try {
    await liquidateRat()
  } catch (e) {
    busy.LiquidateRat.set(0, { duration: 0 })
    console.error(e)
  }
}

/**
 * Liquidate Room
 *
 */
export async function sendLiquidateRoom(roomId: string) {
  if (busy.CloseRoom.current !== 0 || !roomId) return
  playSound("tcm", "blink")

  busy.CloseRoom.set(0.99, { duration: DEFAULT_TIMINGS.CloseRoom })

  try {
    await closeRoom(roomId)
  } catch (e) {
    throw new Error(e)
  } finally {
    goto("/landlord")
    busy.CloseRoom.set(0, { duration: 0 })
  }
}
