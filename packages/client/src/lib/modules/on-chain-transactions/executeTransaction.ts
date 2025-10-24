import type { Hex } from "viem"
import { get } from "svelte/store"

import { publicNetwork, walletNetwork } from "$lib/modules/network"
import { erc20Abi } from "viem"
import { externalAddressesConfig } from "$lib/modules/state/stores"
import { WorldFunctions } from "./index"
import { prepareConnectorClientForTransaction } from "$lib/modules/entry-kit/connector"
import { errorHandler } from "$lib/modules/error-handling"
import { refetchAllowance } from "$lib/modules/erc20Listener"
import { TransactionError } from "../error-handling/errors"

/**
 * Executes an on-chain transaction.
 * @param systemId
 * @param params
 * @returns receipt
 */
export async function executeTransaction(
  systemId: string,
  params: (string | Hex | number | bigint)[] = [],
  useConnectorClient: boolean = false,
  value?: bigint
) {
  try {
    // Prepare the action's client
    const client = useConnectorClient
      ? await prepareConnectorClientForTransaction()
      : get(walletNetwork).walletClient

    let tx
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
      tx = await client.writeContract({
        address: get(walletNetwork).worldContract.address,
        abi: get(walletNetwork).worldContract.abi,
        functionName: systemId,
        args: params,
        gas: 5000000n // TODO: Added to fix gas estimation. Change this.
      })
    }

    // Wait for transaction to be executed
    const receipt = await get(publicNetwork).publicClient.waitForTransactionReceipt({
      hash: tx
    })

    // Force an erc20 query to get updated allowance
    if (systemId === WorldFunctions.Approve) {
      await refetchAllowance()
    }

    if (receipt) {
      if (receipt.status == "success") {
        return receipt
      } else {
        // console.log(receipt)
        throw new TransactionError(`Transaction failed: ${receipt.transactionHash}`)
      }
    }
  } catch (e: unknown) {
    errorHandler(e)
  }
}
