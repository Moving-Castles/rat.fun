import type { SetupWalletNetworkResult } from "$lib/mud/setupWalletNetwork"
import type { Hex } from "viem"
import { ENTITY_TYPE } from "contracts/enums"
import { get } from "svelte/store"
import { walletNetwork, walletType } from "$lib/modules/network"
import { playerAddress, entities } from "$lib/modules/state/stores"
import { WALLET_TYPE } from "./mud/enums"
import { addressToId } from "$lib/modules/utils"

/**
 * Initialize the wallet network - sets up stores.
 */
export function initWalletNetwork(
  wallet: SetupWalletNetworkResult,
  address: Hex,
  type: WALLET_TYPE
): void {
  walletType.set(type)
  walletNetwork.set(wallet)
  playerAddress.set(address)
}

/**
 * Check if a player is spawned without initializing anything.
 * Use this when you just need to check spawn status.
 *
 * @param address - The player's wallet address
 * @returns true if the player entity exists and is of type PLAYER
 */
export function checkIsSpawned(address: Hex): boolean {
  const playerId = addressToId(address)
  const allEntities = get(entities)
  const playerEntity = allEntities[playerId]
  const isSpawned = playerEntity?.entityType === ENTITY_TYPE.PLAYER

  console.log("[checkIsSpawned] playerId:", playerId)
  console.log("[checkIsSpawned] entityCount:", Object.keys(allEntities).length)
  console.log("[checkIsSpawned] playerEntity:", playerEntity)
  console.log("[checkIsSpawned] result:", isSpawned)

  return isSpawned
}
