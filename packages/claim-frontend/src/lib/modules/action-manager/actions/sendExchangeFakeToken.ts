import { exchangeFakeToken } from "$lib/modules/on-chain-transactions/fakeToken"
import { busy } from "../index.svelte"
import { TransactionError } from "$lib/modules/error-handling"

/**
 * Exchange one token for another
 */
export async function sendExchangeFakeToken(amount: number) {
  if (busy.ExchangeFakeToken.current !== 0) return
  busy.ExchangeFakeToken.set(0.99)

  try {
    await exchangeFakeToken(amount)
  } catch (e) {
    throw new TransactionError("Failed exchange fake token", e)
  } finally {
    busy.ExchangeFakeToken.set(0, { duration: 0 })
  }
}
