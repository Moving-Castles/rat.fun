import type { Hex, TransactionReceipt } from "viem"
import type { WalletTransactionClient } from "$lib/mud/setupWalletNetwork"
import { get } from "svelte/store"

import { publicNetwork, walletNetwork } from "$lib/modules/network"
import { erc20Abi } from "viem"
import { externalAddressesConfig } from "$lib/modules/state/stores"
import { WorldFunctions } from "./index"
import { prepareConnectorClientForTransaction } from "$lib/modules/entry-kit/connector"
import { errorHandler } from "$lib/modules/error-handling"
import { refetchAllowance } from "$lib/modules/erc20Listener"
import { TransactionError } from "../error-handling/errors"

type ExecuteTransactionOptions = {
  useConnectorClient?: boolean
  value?: bigint
}

/**
 * Executes an on-chain transaction.
 * @param systemId
 * @param params
 * @returns receipt
 */
export async function executeTransaction(
  systemId: string,
  params: (string | Hex | number | bigint)[] = [],
  options: ExecuteTransactionOptions = {}
): Promise<TransactionReceipt | false> {
  try {
    const { useConnectorClient = false, value } = options
    // Prepare the action's client
    const client: WalletTransactionClient = useConnectorClient
      ? await prepareConnectorClientForTransaction()
      : get(walletNetwork).walletClient

    let tx: Hex
    if (systemId === WorldFunctions.Approve) {
      if (params.length === 2) {
        tx = await client.writeContract({
          address: get(externalAddressesConfig).erc20Address,
          abi: erc20Abi,
          functionName: "approve",
          args: params as [`0x${string}`, bigint],
          gas: 5000000n // TODO: Added to fix gas estimation. Change this.
        })
      } else {
        throw new TransactionError(`Invalid arguments: ${params.join(":")}`)
      }
    } else {
      const worldContract = get(walletNetwork).worldContract
      const txConfig = {
        address: worldContract.address,
        abi: worldContract.abi,
        functionName: systemId,
        args: params,
        gas: 5000000n, // TODO: Added to fix gas estimation. Change this.
        ...(value !== undefined ? { value } : {})
      }
      tx = await client.writeContract(txConfig)
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
  // Wait for transaction to be executed
  const receipt = await get(publicNetwork).publicClient.waitForTransactionReceipt({
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
