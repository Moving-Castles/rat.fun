import type { Hex, TransactionReceipt } from "viem"
import { erc20Abi, encodeFunctionData } from "viem"
import { sendTransaction, getAccount } from "@wagmi/core"
import { get } from "svelte/store"
import { ensureWriteContract, type WalletTransactionClient } from "@ratfun/common/basic-network"
import { TransactionError } from "@ratfun/common/error-handling"

import { publicNetwork, walletNetwork } from "$lib/modules/network"
import { externalAddressesConfig } from "$lib/modules/state/stores"
import { getDrawbridge } from "$lib/modules/drawbridge"
import { errorHandler } from "$lib/modules/error-handling"
import { isUserRejectionError } from "$lib/modules/error-handling/utils"
import { refetchAllowance } from "$lib/modules/erc20Listener"
import { WorldFunctions } from "./index"

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

    let tx: Hex
    if (systemId === WorldFunctions.Approve) {
      if (params.length === 2) {
        // For approve, use wagmi's sendTransaction directly to avoid viem's writeContract
        // which calls unsupported RPC methods on Farcaster/Privy embedded wallets.
        const wagmiConfig = getDrawbridge().getWagmiConfig()
        const account = getAccount(wagmiConfig)

        if (!account.address) {
          throw new TransactionError("No wallet connected")
        }

        const erc20Address = get(externalAddressesConfig).erc20Address
        const approveArgs = params as [`0x${string}`, bigint]

        console.log("[executeTransaction] Starting approve transaction", {
          erc20Address,
          spender: approveArgs[0],
          accountAddress: account.address
        })

        // Encode the approve function call data
        const data = encodeFunctionData({
          abi: erc20Abi,
          functionName: "approve",
          args: approveArgs
        })

        // Estimate gas using public client (RPC transport) instead of wallet provider.
        // Some wallet providers (e.g. Farcaster MiniApp) don't support eth_estimateGas.
        const publicClient = get(publicNetwork).publicClient
        console.log("[executeTransaction] Estimating gas via public client...")

        const gasEstimate = await publicClient.estimateGas({
          account: account.address,
          to: erc20Address,
          data
        })

        console.log("[executeTransaction] Gas estimated:", gasEstimate.toString())

        // Get nonce via public client to avoid wallet provider calling eth_getTransactionCount
        const nonce = await publicClient.getTransactionCount({
          address: account.address
        })
        console.log("[executeTransaction] Nonce fetched:", nonce)

        // Get expected chain ID to ensure transaction goes to correct chain
        const expectedChainId = get(publicNetwork).config.chain.id
        console.log("[executeTransaction] Calling sendTransaction via wagmi...")

        tx = await sendTransaction(wagmiConfig, {
          to: erc20Address,
          data,
          gas: gasEstimate + gasEstimate / 10n, // Add 10% buffer
          nonce,
          chainId: expectedChainId
        })

        console.log("[executeTransaction] sendTransaction returned tx:", tx)
      } else {
        throw new TransactionError(`Invalid arguments: ${params.join(":")}`)
      }
    } else {
      // For non-approve transactions, use the prepared wallet client with writeContract
      const client: WalletTransactionClient = useConnectorClient
        ? ensureWriteContract(await getDrawbridge().getConnectorClient())
        : get(walletNetwork).walletClient

      const worldContract = get(walletNetwork).worldContract
      const txConfig = {
        address: worldContract.address,
        abi: worldContract.abi,
        functionName: systemId,
        args: params,
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
    // Re-throw user rejection errors so callers can handle them with appropriate UI
    if (isUserRejectionError(e)) {
      throw e
    }
    errorHandler(e)
    return false
  }
}

export async function waitForTransactionReceiptSuccess(tx: Hex) {
  // Wait for transaction to be executed
  // Use longer polling interval and more retries to handle RPC rate limits
  const receipt = await get(publicNetwork).publicClient.waitForTransactionReceipt({
    hash: tx,
    pollingInterval: 4_000, // 4 seconds between polls (default is 4s, but be explicit)
    retryCount: 10, // More retries for rate limit recovery
    retryDelay: 2_000 // 2 second base delay between retries
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
