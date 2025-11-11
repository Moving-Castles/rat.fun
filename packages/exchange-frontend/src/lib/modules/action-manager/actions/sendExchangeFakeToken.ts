import { exchangeFakeToken } from "$lib/modules/on-chain-transactions/fakeToken"
import { busy } from "../index.svelte"
import { TransactionError } from "$lib/modules/error-handling/errors"
import { refetchFakeTokenBalance } from "$lib/modules/erc20Listener/fakeToken"

/**
 * Exchange one token for another
 */
export async function sendExchangeFakeToken(amount: number) {
  if (busy.ExchangeFakeToken.current !== 0) return
  busy.ExchangeFakeToken.set(0.99)

  try {
    await exchangeFakeToken(amount)
    await refetchFakeTokenBalance()
  } catch (e) {
    throw new TransactionError("Failed exchange fake token", e)
  } finally {
    busy.ExchangeFakeToken.set(0, { duration: 0 })
  }
}
