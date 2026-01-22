import { approveMaxFakeTokenForExchange } from "$lib/modules/on-chain-transactions/fakeToken"
import { busy } from "../index.svelte"
import { TransactionError } from "$lib/modules/error-handling"

/**
 * Approve fake token for exchange contract to burn
 */
export async function sendApproveFakeToken() {
  if (busy.ApproveFakeToken.current !== 0) return
  busy.ApproveFakeToken.set(0.99)

  try {
    await approveMaxFakeTokenForExchange()
  } catch (e) {
    throw new TransactionError("Failed approve fake token", e)
  } finally {
    busy.ApproveFakeToken.set(0, { duration: 0 })
  }
}
