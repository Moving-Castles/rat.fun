import { maxUint256 } from "viem"
import { executeTransaction } from "./executeTransaction"

export enum WorldFunctions {
  Approve = "ERC20-approve"
}

// --- API --------------------------------------------------------------

export async function approve(address: string, value: bigint) {
  const scaledValue = value * 10n ** 18n
  return await executeTransaction(WorldFunctions.Approve, [address, scaledValue])
}

export async function approveMax(address: string) {
  return await executeTransaction(WorldFunctions.Approve, [address, maxUint256])
}

export async function revokeApproval(address: string) {
  return await executeTransaction(WorldFunctions.Approve, [address, 0n])
}
