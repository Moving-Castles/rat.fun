import { get } from "svelte/store"

import { externalAddressesConfig } from "$lib/modules/state/stores"
import { revokeApproval } from "$lib/modules/on-chain-transactions"
import { busy } from "../index.svelte"
import { TransactionError } from "$lib/modules/error-handling/errors"

const DEFAULT_TIMING = 4000

/**
 * Revoke approval (set to 0)
 *
 */
export async function sendRevokeApproval() {
  const _externalAddressesConfig = get(externalAddressesConfig)

  if (busy.RevokeApproval.current !== 0) return
  busy.RevokeApproval.set(0.99, { duration: DEFAULT_TIMING })

  try {
    await revokeApproval(_externalAddressesConfig.gamePoolAddress)
  } catch (e) {
    throw new TransactionError("Failed to revoke token allowance", e)
  } finally {
    busy.RevokeApproval.set(0, { duration: 0 })
  }
}
