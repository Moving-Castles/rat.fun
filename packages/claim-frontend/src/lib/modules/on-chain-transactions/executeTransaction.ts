import type { Hex } from "viem"
import { get } from "svelte/store"

import { publicClient as publicClientStore } from "$lib/network"
import { TransactionError } from "$lib/modules/error-handling"

export async function waitForTransactionReceiptSuccess(tx: Hex) {
  const publicClient = get(publicClientStore)
  if (!publicClient) {
    throw new TransactionError("Public client not initialized")
  }

  // Wait for transaction to be executed
  const receipt = await publicClient.waitForTransactionReceipt({
    hash: tx
  })
  if (receipt) {
    if (receipt.status == "success") {
      return receipt
    } else {
      throw new TransactionError(`Transaction failed: ${receipt.transactionHash}`)
    }
  }
  return false
}
