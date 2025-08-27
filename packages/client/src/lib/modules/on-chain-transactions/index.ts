import { maxUint256, parseEther } from "viem"
import { WALLET_TYPE } from "$lib/mud/enums"
import { get } from "svelte/store"
import { QueryClient } from "@tanstack/svelte-query"
import { walletType } from "$lib/modules/network"
import { executeTransaction } from "./executeTransaction"

const NAMESPACE = "ratfun__"

export enum WorldFunctions {
  Spawn = NAMESPACE + "spawn",
  CreateRat = NAMESPACE + "createRat",
  LiquidateRat = NAMESPACE + "liquidateRat",
  ReAbsorbItem = NAMESPACE + "reAbsorbItem",
  CloseRoom = NAMESPACE + "closeRoom",
  Approve = "ERC20-approve",
  BuyWithEth = "buyWithEth",
  GiveCallerTokens = NAMESPACE + "giveCallerTokens"
}

// --- API --------------------------------------------------------------

export async function spawn(queryClient: QueryClient, name: string) {
  return await executeTransaction(queryClient, WorldFunctions.Spawn, [name])
}

export async function createRat(queryClient: QueryClient, name: string) {
  return await executeTransaction(queryClient, WorldFunctions.CreateRat, [name])
}

export async function liquidateRat(queryClient: QueryClient) {
  return await executeTransaction(queryClient, WorldFunctions.LiquidateRat, [])
}

export async function reAbsorbItem(queryClient: QueryClient, itemId: string) {
  return await executeTransaction(queryClient, WorldFunctions.ReAbsorbItem, [itemId])
}

export async function closeRoom(queryClient: QueryClient, roomId: string) {
  return await executeTransaction(queryClient, WorldFunctions.CloseRoom, [roomId])
}

export async function approve(queryClient: QueryClient, address: string, value: bigint) {
  const scaledValue = value * 10n ** 18n
  const useConnectorClient = get(walletType) === WALLET_TYPE.ENTRYKIT
  return await executeTransaction(
    queryClient,
    WorldFunctions.Approve,
    [address, scaledValue],
    useConnectorClient
  )
}

export async function approveMax(queryClient: QueryClient, address: string) {
  const useConnectorClient = get(walletType) === WALLET_TYPE.ENTRYKIT
  return await executeTransaction(
    queryClient,
    WorldFunctions.Approve,
    [address, maxUint256],
    useConnectorClient
  )
}

export async function buyWithEth(
  queryClient: QueryClient,
  purchaseTokenAmount: number,
  countryCode: string
) {
  const useConnectorClient = get(walletType) === WALLET_TYPE.ENTRYKIT
  return await executeTransaction(
    queryClient,
    WorldFunctions.BuyWithEth,
    [BigInt(purchaseTokenAmount), countryCode],
    useConnectorClient,
    parseEther("0.001")
  )
}

export async function giveCallerTokens(queryClient: QueryClient) {
  return await executeTransaction(queryClient, WorldFunctions.GiveCallerTokens, [])
}
