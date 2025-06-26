import { maxUint256 } from "viem"
import { WALLET_TYPE } from "$lib/mud/enums"
import { get } from "svelte/store"
import { walletType } from "../network"
import { addToSequencer } from "./actionSequencer"

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
