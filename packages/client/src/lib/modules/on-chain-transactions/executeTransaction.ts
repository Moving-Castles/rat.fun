import type { Hex } from "viem"
import { get } from "svelte/store"
import { transactionQueue } from "@latticexyz/common/actions"

import { publicNetwork, walletNetwork } from "$lib/modules/network"
import { erc20Abi } from "viem"
import { addChain, switchChain } from "viem/actions"
import { getAccount, getChainId, getConnectorClient } from "@wagmi/core"
import { externalAddressesConfig } from "$lib/modules/state/stores"
import { WorldFunctions } from "./index"
import { getChain } from "$lib/mud/utils"
import { wagmiConfigStateful } from "$lib/modules/entry-kit/stores"
import { errorHandler } from "$lib/modules/error-handling"
import { refetchAllowance } from "$lib/modules/erc20Listener"
import { TransactionError, WagmiConfigUnavailableError } from "../error-handling/errors"
import mainSaleAbi from "contracts/out/MainSale.sol/MainSale.abi.json"

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
      ? await prepareConnectorClient()
      : get(walletNetwork).walletClient

    let tx
    if (systemId === WorldFunctions.Approve) {
      tx = await client.writeContract({
        address: get(externalAddressesConfig).erc20Address,
        abi: erc20Abi,
        functionName: "approve",
        args: params,
        gas: 5000000n // TODO: Added to fix gas estimation. Change this.
      })
    } else if (systemId === WorldFunctions.BuyWithEth) {
      tx = await client.writeContract({
        address: get(externalAddressesConfig).mainSaleAddress,
        abi: mainSaleAbi,
        functionName: "buyWithEth",
        args: params,
        value: value,
        gas: 5000000n // TODO: Added to fix gas estimation. Change this.
      })
    } else {
      // @ts-expect-error - MUD world contract ABI causes excessive type instantiation
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
        console.log(receipt)
        throw new TransactionError(`Transaction failed: ${receipt.transactionHash}`)
      }
    }
  } catch (e: unknown) {
    errorHandler(e)
  }
}

async function prepareConnectorClient() {
  const wagmiConfig = get(wagmiConfigStateful)
  if (!wagmiConfig) {
    throw new WagmiConfigUnavailableError()
  }
  let connectorClient = await getConnectorClient(wagmiConfig)

  // User's wallet may switch between different chains, ensure the current chain is correct
  const expectedChainId = get(publicNetwork).config.chain.id
  if (getChainId(wagmiConfig) !== expectedChainId) {
    try {
      await switchChain(connectorClient, { id: expectedChainId })
    } catch (e) {
      await addChain(connectorClient, { chain: getChain(expectedChainId) })
      await switchChain(connectorClient, { id: expectedChainId })
    }

    // manually update the connector and its chain id
    // (syncing wagmi state update from react to svelte can take a while and the config state is likely stale)
    connectorClient = await getConnectorClient(wagmiConfig, {
      connector: getAccount(wagmiConfig).connector
    })
  }
  // MUD's `transactionQueue` extends the client with `writeContract` method
  return connectorClient.extend(transactionQueue())
}
