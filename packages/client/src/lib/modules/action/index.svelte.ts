import { maxUint256 } from "viem"
import { WALLET_TYPE } from "$lib/mud/enums"
import { get } from "svelte/store"
import { walletType } from "../network"
import { addToSequencer } from "./actionSequencer"
import { Tween } from "svelte/motion"
import { getEnvironment } from "$lib/modules/network"
import { playSound } from "$lib/modules/sound"
import { goto } from "$app/navigation"
import {
  // rat,
  gameConfig,
  // levels,
  // playerERC20Balance,
  playerERC20Allowance
} from "$lib/modules/state/base/stores"

import { waitForCompletion } from "./actionSequencer/utils"
import { createRoom } from "$lib/components/Landlord/CreateRoom"

const NAMESPACE = "ratroom__"

export enum WorldFunctions {
  Spawn = NAMESPACE + "spawn",
  CreateRat = NAMESPACE + "createRat",
  LiquidateRat = NAMESPACE + "liquidateRat",
  DropItem = NAMESPACE + "dropItem",
  CloseRoom = NAMESPACE + "closeRoom",
  Approve = "ERC20-approve",
  GiveCallerTokens = NAMESPACE + "giveCallerTokens"
}

// --- API --------------------------------------------------------------

export function spawn(name: string) {
  return addToSequencer(WorldFunctions.Spawn, [name])
}

export function createRat(name: string) {
  return addToSequencer(WorldFunctions.CreateRat, [name])
}

export function liquidateRat() {
  return addToSequencer(WorldFunctions.LiquidateRat, [])
}

export function dropItem(itemId: string) {
  return addToSequencer(WorldFunctions.DropItem, [itemId])
}

export function closeRoom(roomId: string) {
  return addToSequencer(WorldFunctions.CloseRoom, [roomId])
}

export function approve(address: string, value: bigint) {
  const scaledValue = value * 10n ** 18n
  const useUserAccount = get(walletType) === WALLET_TYPE.ACCOUNTKIT
  return addToSequencer(WorldFunctions.Approve, [address, scaledValue], useUserAccount)
}

export function approveMax(address: string) {
  const useUserAccount = get(walletType) === WALLET_TYPE.ACCOUNTKIT
  return addToSequencer(WorldFunctions.Approve, [address, maxUint256], useUserAccount)
}

export function giveCallerTokens() {
  return addToSequencer(WorldFunctions.GiveCallerTokens, [])
}

const DEFAULT_TIMINGS = {
  Approve: 6000,
  CloseRoom: 1000,
  CreateRat: 1000,
  DropItem: 1000,
  GiveCallerTokens: 1000,
  LiquidateRat: 1000,
  Spawn: 1000
}

export const busy = $state({
  Approve: new Tween(0, { duration: DEFAULT_TIMINGS.Approve }),
  CloseRoom: new Tween(0, { duration: DEFAULT_TIMINGS.CloseRoom }),
  CreateRat: new Tween(0, { duration: DEFAULT_TIMINGS.CreateRat }),
  DropItem: new Tween(0, { duration: DEFAULT_TIMINGS.DropItem }),
  GiveCallerTokens: new Tween(0, { duration: DEFAULT_TIMINGS.GiveCallerTokens }),
  LiquidateRat: new Tween(0, { duration: DEFAULT_TIMINGS.LiquidateRat }),
  Spawn: new Tween(0, { duration: DEFAULT_TIMINGS.Spawn })
})

/** Async function to be called from a component in the frontend on layout level */
export async function sendCreateRoom(newPrompt: string, levelId: string, roomCreationCost: bigint) {
  const env = getEnvironment(new URL(window.location.href))
  const _gameConfig = get(gameConfig)
  const _playerERC20Allowance = get(playerERC20Allowance)

  if (busy.Approve.current > 0) return
  busy.Approve.set(0.99) // we never get to 1

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
    busy.Approve.set(0, { duration: 0 })
    return
  }

  const result = await createRoom(env, newPrompt, levelId)
  busy.Approve.set(0, { duration: 0 })
  busy.Approve.set(0, { duration: DEFAULT_TIMINGS.Approve }) // resets the tween duration

  if (result.roomId) {
    goto(`/landlord/${result.roomId}`)
  }
}

/** Create rat */
export async function sendCreateRat(name: string) {
  const _gameConfig = get(gameConfig)
  const _playerERC20Allowance = get(playerERC20Allowance)

  if (busy.CreateRat.current > 0) return
  playSound("tcm", "blink")
  busy.CreateRat.set(0.99)
  try {
    if (_playerERC20Allowance < _gameConfig.gameConfig.ratCreationCost) {
      const approveAction = approve(
        _gameConfig.externalAddressesConfig.gamePoolAddress,
        _gameConfig.gameConfig.ratCreationCost
      )
      await waitForCompletion(approveAction)
    }
    const createRatAction = createRat(name)
    await waitForCompletion(createRatAction)
  } catch (e) {
    console.error(e)
    busy.CreateRat.set(0, { duration: 0 })
  }
}
