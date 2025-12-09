import { maxUint256, parseEther } from "viem"
import { WALLET_TYPE } from "@ratfun/common/basic-network"
import { get } from "svelte/store"
import { walletType } from "$lib/modules/network"
import { executeTransaction } from "./executeTransaction"

const NAMESPACE = "ratfun__"

export enum WorldFunctions {
  Spawn = NAMESPACE + "spawn",
  CreateRat = NAMESPACE + "createRat",
  LiquidateRat = NAMESPACE + "liquidateRat",
  CloseTrip = NAMESPACE + "closeTrip",
  AddTripBalance = NAMESPACE + "addTripBalance",
  Approve = "ERC20-approve",
  BuyWithEth = "buyWithEth",
  GiveCallerTokens = NAMESPACE + "giveCallerTokens",
  UnlockAdmin = NAMESPACE + "unlockAdmin"
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

export async function closeTrip(tripId: string) {
  return await executeTransaction(WorldFunctions.CloseTrip, [tripId])
}

export async function addTripBalance(tripId: string, amount: bigint) {
  return await executeTransaction(WorldFunctions.AddTripBalance, [tripId, amount])
}

export async function approve(address: string, value: bigint) {
  const scaledValue = value * 10n ** 18n
  const useConnectorClient = get(walletType) === WALLET_TYPE.DRAWBRIDGE
  return await executeTransaction(WorldFunctions.Approve, [address, scaledValue], {
    useConnectorClient
  })
}

export async function approveMax(address: string) {
  const useConnectorClient = get(walletType) === WALLET_TYPE.DRAWBRIDGE
  return await executeTransaction(WorldFunctions.Approve, [address, maxUint256], {
    useConnectorClient
  })
}

export async function revokeApproval(address: string) {
  const useConnectorClient = get(walletType) === WALLET_TYPE.DRAWBRIDGE
  return await executeTransaction(WorldFunctions.Approve, [address, 0n], {
    useConnectorClient
  })
}

export async function buyWithEth(purchaseTokenAmount: number, countryCode: string) {
  const useConnectorClient = get(walletType) === WALLET_TYPE.DRAWBRIDGE
  return await executeTransaction(
    WorldFunctions.BuyWithEth,
    [BigInt(purchaseTokenAmount), countryCode],
    {
      useConnectorClient,
      value: parseEther("0.001")
    }
  )
}

export async function giveCallerTokens() {
  return await executeTransaction(WorldFunctions.GiveCallerTokens, [])
}

export async function unlockAdmin() {
  return await executeTransaction(WorldFunctions.UnlockAdmin, [])
}
