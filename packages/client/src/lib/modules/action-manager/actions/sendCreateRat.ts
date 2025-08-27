import { get } from "svelte/store"
import { QueryClient } from "@tanstack/svelte-query"
import { playSound } from "$lib/modules/sound"
import {
  gameConfig,
  externalAddressesConfig,
  playerERC20Allowance
} from "$lib/modules/state/stores"
import { createRat, approve } from "$lib/modules/on-chain-transactions"
import { busy } from "../index.svelte"
import { RatError } from "$lib/modules/error-handling/errors"

/**
 * Create rat
 * @param name The name of the rat to create
 */
export async function sendCreateRat(queryClient: QueryClient, name: string) {
  const _gameConfig = get(gameConfig)
  const _externalAddressesConfig = get(externalAddressesConfig)
  const _playerERC20Allowance = get(playerERC20Allowance)

  if (busy.CreateRat.current !== 0) return
  playSound("ratfun", "blink")
  busy.CreateRat.set(0.99)
  // Approve
  try {
    if (_playerERC20Allowance < _gameConfig.ratCreationCost) {
      await approve(queryClient, _externalAddressesConfig.gamePoolAddress, _gameConfig.ratCreationCost)
    }
    await createRat(queryClient, name)
  } catch (e) {
    throw new RatError(`Failed to create rat "${name}"`, undefined)
  } finally {
    busy.CreateRat.set(0, { duration: 0 })
  }
}
