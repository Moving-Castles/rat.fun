import { erc20Abi, maxUint256, type TransactionReceipt } from "viem"
import { ERC20EquivalentExchangeAbi } from "contracts/externalAbis"
import { prepareConnectorClientForTransaction } from "$lib/modules/entry-kit/connector"
import { errorHandler } from "$lib/modules/error-handling"
import { waitForTransactionReceiptSuccess } from "./executeTransaction"

// Mainnet-only addresses
export const fakeTokenErc20Address = "0x13751a213f39ef4DadfcD1eb35aAC8AEc0De5bA6"
// TODO replace with real exchange address (this one exchanges fakeRat for itself)
export const fakeTokenExchangeAddress = "0x2a2c0be08bb8f5e7debc58d6e41cad6fdfd619fd"

/**
 * Must be called before `exchangeFakeToken` so the exchange contract can burn fake tokens
 */
export async function approveMaxFakeTokenForExchange(): Promise<TransactionReceipt | false> {
  const spender = fakeTokenExchangeAddress
  const scaledAmount = maxUint256

  try {
    // Prepare the action's client
    const client = await prepareConnectorClientForTransaction()

    const tx = await client.writeContract({
      address: fakeTokenErc20Address,
      abi: erc20Abi,
      functionName: "approve",
      args: [spender, scaledAmount]
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
    // Prepare the action's client
    const client = await prepareConnectorClientForTransaction()

    const tx = await client.writeContract({
      address: fakeTokenExchangeAddress,
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
