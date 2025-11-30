import { erc20Abi, type Hex, type TransactionReceipt } from "viem"
import { ERC20EquivalentExchangeAbi } from "contracts/externalAbis"
import { prepareConnectorClientForTransaction } from "$lib/modules/drawbridge/connector"
import { errorHandler } from "$lib/modules/error-handling"
import { getPublicClient } from "$lib/network"
import {
  PUBLIC_FAKE_RAT_TOKEN_ADDRESS,
  PUBLIC_RAT_TOKEN_ADDRESS,
  PUBLIC_EXCHANGE_CONTRACT_ADDRESS
} from "$env/static/public"
import { TransactionError } from "$lib/modules/error-handling/errors"

// Contract addresses from environment
export const fakeRatTokenAddress = PUBLIC_FAKE_RAT_TOKEN_ADDRESS as Hex
export const ratTokenAddress = PUBLIC_RAT_TOKEN_ADDRESS as Hex
export const exchangeContractAddress = PUBLIC_EXCHANGE_CONTRACT_ADDRESS as Hex

/**
 * Wait for transaction receipt and verify success
 */
async function waitForTransactionReceiptSuccess(tx: Hex): Promise<TransactionReceipt | false> {
  const publicClient = getPublicClient()

  const receipt = await publicClient.waitForTransactionReceipt({
    hash: tx
  })
  if (receipt) {
    if (receipt.status === "success") {
      return receipt
    } else {
      throw new TransactionError(`Transaction failed: ${receipt.transactionHash}`)
    }
  }
  return false
}

/**
 * Approve the exchange contract to spend the exact amount of fake tokens
 * @param amount the amount of tokens to approve (in whole tokens, not scaled)
 */
export async function approveFakeTokenForExchange(
  amount: number
): Promise<TransactionReceipt | false> {
  const scaledAmount = BigInt(amount) * 10n ** 18n

  try {
    const client = await prepareConnectorClientForTransaction()

    const tx = await client.writeContract({
      address: fakeRatTokenAddress,
      abi: erc20Abi,
      functionName: "approve",
      args: [exchangeContractAddress, scaledAmount]
    })

    return await waitForTransactionReceiptSuccess(tx)
  } catch (e: unknown) {
    errorHandler(e)
    return false
  }
}

/**
 * The exchange contract burns fake tokens and transfers an equivalent `amount` of real tokens to sender
 * @param amount the amount of tokens to exchange
 */
export async function exchangeFakeToken(amount: number): Promise<TransactionReceipt | false> {
  const scaledAmount = BigInt(amount) * 10n ** 18n

  try {
    const client = await prepareConnectorClientForTransaction()

    const tx = await client.writeContract({
      address: exchangeContractAddress,
      abi: ERC20EquivalentExchangeAbi,
      functionName: "exchange",
      args: [scaledAmount]
    })

    return await waitForTransactionReceiptSuccess(tx)
  } catch (e: unknown) {
    errorHandler(e)
    return false
  }
}
