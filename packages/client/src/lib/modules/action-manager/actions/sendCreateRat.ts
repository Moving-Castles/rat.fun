import { get } from "svelte/store"
import { playSound } from "$lib/modules/sound"
import { gameConfig, playerERC20Allowance } from "$lib/modules/state/base/stores"
import { createRat, approve } from "$lib/modules/on-chain-transactions"
import { busy } from "../index.svelte"

/**
 * Create rat
 * @param name The name of the rat to create
 */
export async function sendCreateRat(name: string) {
  const _gameConfig = get(gameConfig)
  const _playerERC20Allowance = get(playerERC20Allowance)

  if (busy.CreateRat.current !== 0) return
  playSound("tcm", "blink")
  busy.CreateRat.set(0.99)
  // Approve
  try {
    if (_playerERC20Allowance < _gameConfig.gameConfig.ratCreationCost) {
      await approve(
        _gameConfig.externalAddressesConfig.gamePoolAddress,
        _gameConfig.gameConfig.ratCreationCost
      )
    }
    await createRat(name)
  } catch (e) {
    console.error(e)
    throw new Error(String(e))
  } finally {
    busy.CreateRat.set(0, { duration: 0 })
  }
}
