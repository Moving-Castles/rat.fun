import { QueryClient } from "@tanstack/svelte-query"
import { buyWithEth } from "$lib/modules/on-chain-transactions"
import { busy } from "../index.svelte"
import { TransactionError } from "$lib/modules/error-handling/errors"

const DEFAULT_TIMING = 4000

/**
 * Buy tokens with ETH
 *
 */
export async function sendBuyWithEth(queryClient: QueryClient) {
  if (busy.BuyWithEth.current !== 0) return
  busy.BuyWithEth.set(0.99, { duration: DEFAULT_TIMING })

  try {
    // Try to buy 1 token (1e18 wei = 1 full token)
    await buyWithEth(queryClient, 1 * 1e18, "US")
  } catch (e) {
    throw new TransactionError("Failed buy tokens with ETH", e)
  } finally {
    busy.BuyWithEth.set(0, { duration: 0 })
  }
}
