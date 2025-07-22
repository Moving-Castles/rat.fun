import { get } from "svelte/store"
import { gameConfig } from "$lib/modules/state/stores"
import { approveMax } from "$lib/modules/on-chain-transactions"
import { busy } from "../index.svelte"
import { TransactionError } from "$lib/modules/error-handling/errors"

const DEFAULT_TIMING = 4000

/**
 * Approve max
 *
 */
export async function sendApproveMax() {
  const _gameConfig = get(gameConfig)

  if (busy.ApproveMax.current !== 0) return
  busy.ApproveMax.set(0.99, { duration: DEFAULT_TIMING })

  try {
    await approveMax(_gameConfig.externalAddressesConfig.gamePoolAddress)
  } catch (e) {
    throw new TransactionError("Failed to approve max token allowance", e)
  } finally {
    busy.ApproveMax.set(0, { duration: 0 })
  }
}
