import { QueryClient } from "@tanstack/svelte-query"
import { giveCallerTokens } from "$lib/modules/on-chain-transactions"
import { busy } from "../index.svelte"
import { TransactionError } from "$lib/modules/error-handling/errors"

const DEFAULT_TIMING = 4000

/**
 * Give caller tokens
 *
 */
export async function sendGiveCallerTokens(queryClient: QueryClient) {
  if (busy.GiveCallerTokens.current !== 0) return
  busy.GiveCallerTokens.set(0.99, { duration: DEFAULT_TIMING })

  try {
    await giveCallerTokens(queryClient)
  } catch (e) {
    throw new TransactionError("Failed to give caller tokens", e)
  } finally {
    busy.GiveCallerTokens.set(0, { duration: 0 })
  }
}
