import { get } from "svelte/store"
import { externalAddressesConfig } from "$lib/modules/state/stores"
import { playerERC20Allowance } from "$lib/modules/erc20Listener/stores"
import { unlockAdmin, approveMax } from "$lib/modules/on-chain-transactions"
import { busy } from "../index.svelte"

const UNLOCK_ADMIN_COST = 500

/**
 * Unlock admin/trips-lab privileges for the current player
 * Costs 500 tokens
 */
export async function sendUnlockAdmin() {
  const _externalAddressesConfig = get(externalAddressesConfig)
  const _playerERC20Allowance = get(playerERC20Allowance)

  if (busy.UnlockAdmin.current !== 0) return

  busy.UnlockAdmin.set(0.99)

  try {
    // Approve if needed
    if (_playerERC20Allowance < UNLOCK_ADMIN_COST) {
      await approveMax(_externalAddressesConfig.gamePoolAddress)
    }
    await unlockAdmin()
  } catch {
    throw new Error("Failed to unlock admin")
  } finally {
    busy.UnlockAdmin.set(0, { duration: 0 })
  }
}
