import { get } from "svelte/store"

import { externalAddressesConfig } from "$lib/modules/state/stores"
import { approve } from "$lib/modules/on-chain-transactions"
import { refetchAllowance } from "$lib/modules/erc20Listener"
import { busy } from "../index.svelte"
import { TransactionError } from "$lib/modules/error-handling/errors"

const DEFAULT_TIMING = 4000

/**
 * Approve a specific amount
 * @param amount - The amount to approve (in token units, not wei)
 */
export async function sendApprove(amount: bigint) {
  const _externalAddressesConfig = get(externalAddressesConfig)

  if (busy.Approve.current !== 0) return
  busy.Approve.set(0.99, { duration: DEFAULT_TIMING })

  try {
    await approve(_externalAddressesConfig.gamePoolAddress, amount)
    await refetchAllowance()
  } catch (e) {
    throw new TransactionError("Failed to set token allowance", e)
  } finally {
    busy.Approve.set(0, { duration: 0 })
  }
}
