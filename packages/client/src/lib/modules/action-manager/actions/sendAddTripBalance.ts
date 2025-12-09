import { get } from "svelte/store"
import { externalAddressesConfig } from "$lib/modules/state/stores"
import { playerERC20Allowance } from "$lib/modules/erc20Listener/stores"
import { approveMax, addTripBalance } from "$lib/modules/on-chain-transactions"
import { busy } from "../index.svelte"
import { TransactionError } from "@ratfun/common/error-handling"

const DEFAULT_TIMING = 4000

/**
 * Add balance to an existing trip
 * @param tripId The ID of the trip to add balance to
 * @param amount The amount to add (in token units, not wei)
 */
export async function sendAddTripBalance(tripId: string, amount: bigint) {
  const _externalAddressesConfig = get(externalAddressesConfig)
  const _playerERC20Allowance = get(playerERC20Allowance)

  if (busy.AddTripBalance.current !== 0 || !tripId) return
  busy.AddTripBalance.set(0.99, { duration: DEFAULT_TIMING })

  try {
    // Approve if needed
    if (_playerERC20Allowance < Number(amount)) {
      await approveMax(_externalAddressesConfig.gamePoolAddress)
    }

    await addTripBalance(tripId, amount)
  } catch (e) {
    throw new TransactionError(`Failed to add balance to trip ${tripId}`, e)
  } finally {
    busy.AddTripBalance.set(0, { duration: 0 })
  }
}
