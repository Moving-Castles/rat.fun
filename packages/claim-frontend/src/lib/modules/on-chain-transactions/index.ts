import { maxUint256 } from "viem"
import { WALLET_TYPE } from "$lib/mud/enums"
import { get } from "svelte/store"
import { walletType } from "$lib/modules/network"
import { executeTransaction } from "./executeTransaction"

// const NAMESPACE = "ratfun__"

export enum WorldFunctions {
  Approve = "ERC20-approve"
}

// --- API --------------------------------------------------------------

export async function approve(address: string, value: bigint) {
  const scaledValue = value * 10n ** 18n
  const useConnectorClient = get(walletType) === WALLET_TYPE.ENTRYKIT
  return await executeTransaction(WorldFunctions.Approve, [address, scaledValue], {
    useConnectorClient
  })
}

export async function approveMax(address: string) {
  const useConnectorClient = get(walletType) === WALLET_TYPE.ENTRYKIT
  return await executeTransaction(WorldFunctions.Approve, [address, maxUint256], {
    useConnectorClient
  })
}

export async function revokeApproval(address: string) {
  const useConnectorClient = get(walletType) === WALLET_TYPE.ENTRYKIT
  return await executeTransaction(WorldFunctions.Approve, [address, 0n], {
    useConnectorClient
  })
}
