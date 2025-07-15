import { maxUint256 } from "viem"
import { WALLET_TYPE } from "$lib/mud/enums"
import { get } from "svelte/store"
import { walletType } from "$lib/modules/network"
import { executeTransaction } from "./executeTransaction"

const NAMESPACE = "ratfun__"

export enum WorldFunctions {
  Spawn = NAMESPACE + "spawn",
  CreateRat = NAMESPACE + "createRat",
  LiquidateRat = NAMESPACE + "liquidateRat",
  SellItem = NAMESPACE + "sellItem",
  CloseRoom = NAMESPACE + "closeRoom",
  Approve = "ERC20-approve",
  GiveCallerTokens = NAMESPACE + "giveCallerTokens"
}

// --- API --------------------------------------------------------------

export async function spawn(name: string) {
  return await executeTransaction(WorldFunctions.Spawn, [name])
}

export async function createRat(name: string) {
  return await executeTransaction(WorldFunctions.CreateRat, [name])
}

export async function liquidateRat() {
  return await executeTransaction(WorldFunctions.LiquidateRat, [])
}

export async function sellItem(itemId: string) {
  return await executeTransaction(WorldFunctions.SellItem, [itemId])
}

export async function closeRoom(roomId: string) {
  return await executeTransaction(WorldFunctions.CloseRoom, [roomId])
}

export async function approve(address: string, value: bigint) {
  const scaledValue = value * 10n ** 18n
  const useUserAccount = get(walletType) === WALLET_TYPE.ENTRYKIT
  return await executeTransaction(WorldFunctions.Approve, [address, scaledValue], useUserAccount)
}

export async function approveMax(address: string) {
  const useUserAccount = get(walletType) === WALLET_TYPE.ENTRYKIT
  return await executeTransaction(WorldFunctions.Approve, [address, maxUint256], useUserAccount)
}

export async function giveCallerTokens() {
  return await executeTransaction(WorldFunctions.GiveCallerTokens, [])
}
