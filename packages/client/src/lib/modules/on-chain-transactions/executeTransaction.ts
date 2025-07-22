import type { Hex } from "viem"
import { get } from "svelte/store"
import { transactionQueue } from "@latticexyz/common/actions"
import { publicNetwork, walletNetwork } from "$lib/modules/network"
import { erc20Abi } from "viem"
import { addChain, switchChain } from "viem/actions"
import { gameConfig } from "$lib/modules/state/stores"
import { WorldFunctions } from "./index"
import { getChain } from "$lib/mud/utils"
import { entryKitConnector } from "$lib/modules/entry-kit/stores"
import { errorHandler } from "$lib/modules/error-handling"
import {
  TransactionError,
  ConnectorClientUnavailableError,
  type ExpectedError
} from "../error-handling/errors"

/**
 * Executes an on-chain transaction.
 * @param systemId
 * @param params
 * @returns receipt
 */
export async function executeTransaction(
  systemId: string,
  params: (string | Hex | number | bigint)[] = [],
  useConnectorClient: boolean = false
) {
  try {
    // Prepare the action's client
    const client = useConnectorClient
      ? await prepareConnectorClient()
      : get(walletNetwork).walletClient

    let tx
    if (systemId === WorldFunctions.Approve) {
      tx = await client.writeContract({
        address: get(gameConfig).externalAddressesConfig.erc20Address,
        abi: erc20Abi,
        functionName: "approve",
        args: params,
        gas: 5000000n // TODO: Added to fix gas estimation. Change this.
      })
    } else {
      tx = await client.writeContract({
        address: get(walletNetwork).worldContract.address,
        abi: get(walletNetwork).worldContract.abi,
        functionName: systemId,
        args: params,
        gas: 5000000n // TODO: Added to fix gas estimation. Change this.
      })
    }

    console.log("tx", tx)

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
  } catch (e: unknown) {
    errorHandler(e)
  }
}

async function prepareConnectorClient() {
  const connectorClient = get(entryKitConnector)

  console.log("connectorClient", connectorClient)

  if (!connectorClient) {
    throw new ConnectorClientUnavailableError()
  }
  // User's wallet may switch between different chains, ensure the current chain is correct
  const expectedChainId = get(publicNetwork).config.chain.id
  if (connectorClient.chain.id !== expectedChainId) {
    try {
      await switchChain(connectorClient, { id: expectedChainId })
    } catch (e) {
      await addChain(connectorClient, { chain: getChain(expectedChainId) })
      await switchChain(connectorClient, { id: expectedChainId })
    }
  }
  // MUD's `transactionQueue` extends the client with `writeContract` method
  return connectorClient.extend(transactionQueue())
}
