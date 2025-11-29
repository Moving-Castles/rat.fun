import type { Hex, TransactionReceipt } from "viem"
import { get } from "svelte/store"
import { erc20Abi } from "viem"

import { publicClient as publicClientStore, externalAddresses } from "$lib/network"
import { WorldFunctions } from "./index"
import {
  prepareConnectorClientForTransaction,
  type WalletTransactionClient
} from "$lib/modules/drawbridge/connector"
import { errorHandler } from "$lib/modules/error-handling"
import { refetchAllowance } from "$lib/modules/erc20Listener"
import { TransactionError } from "../error-handling/errors"

/**
 * Executes an on-chain transaction.
 * Simplified for claim-frontend - only supports ERC20 approve.
 *
 * @param systemId - The function to call (only WorldFunctions.Approve supported)
 * @param params - The function parameters
 * @returns receipt or false if failed
 */
export async function executeTransaction(
  systemId: string,
  params: (string | Hex | number | bigint)[] = []
): Promise<TransactionReceipt | false> {
  try {
    // Always use connector client in wallet-only mode
    const client: WalletTransactionClient = await prepareConnectorClientForTransaction()

    const addresses = get(externalAddresses)
    if (!addresses) {
      throw new TransactionError("External addresses not loaded")
    }

    let tx: Hex
    if (systemId === WorldFunctions.Approve) {
      if (params.length === 2) {
        tx = await client.writeContract({
          address: addresses.erc20Address,
          abi: erc20Abi,
          functionName: "approve",
          args: params as [`0x${string}`, bigint],
          gas: 5000000n // TODO: Added to fix gas estimation. Change this.
        })
      } else {
        throw new TransactionError(`Invalid arguments: ${params.join(":")}`)
      }
    } else {
      throw new TransactionError(`Unsupported function: ${systemId}`)
    }

    const receipt = await waitForTransactionReceiptSuccess(tx)

    // Force an erc20 query to get updated allowance
    if (systemId === WorldFunctions.Approve) {
      await refetchAllowance()
    }

    return receipt
  } catch (e: unknown) {
    errorHandler(e)
    return false
  }
}

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
