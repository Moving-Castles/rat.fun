/*
 * ========================================
 * state/base/stores.ts
 * ========================================
 * Central store for all entities in the game.
 */

import { writable, derived } from "svelte/store"
import { addressToId, addressToRatImage } from "$lib/modules/utils"
import { ENTITY_TYPE } from "contracts/enums"
import {
  filterByEntitytype,
  filterByLevel,
  filterByPlayer,
  filterByOthers,
} from "./utils"
import { GAME_CONFIG_ID } from "./constants"

// * * * * * * * * * * * * * * * * *
// DEFAULT ENTITY TYPES
// * * * * * * * * * * * * * * * * *

/**
 * Mirror of the full on chain state.
 * Only ever written to via the update systems in module/ssystems
 */
export const entities = writable({} as Entities)

// * * * * * * * * * * * * * * * * *
// GAME CONFIG ENTITIES
// * * * * * * * * * * * * * * * * *

export const gameConfig = derived(
  entities,
  $entities => ($entities[GAME_CONFIG_ID] || {}) as GameConfig
)

// * * * * * * * * * * * * * * * * *
// GAME ELEMENT STORES
// * * * * * * * * * * * * * * * * *

export const players = derived(
  entities,
  $entities => filterByEntitytype($entities, ENTITY_TYPE.PLAYER) as Players
)
export const rats = derived(
  entities,
  $entities => filterByEntitytype($entities, ENTITY_TYPE.RAT) as Rats
)
export const rooms = derived(
  entities,
  $entities => filterByEntitytype($entities, ENTITY_TYPE.ROOM) as Rooms
)
export const traits = derived(
  entities,
  $entities => filterByEntitytype($entities, ENTITY_TYPE.TRAIT) as Traits
)
export const items = derived(
  entities,
  $entities => filterByEntitytype($entities, ENTITY_TYPE.ITEM) as Items
)
export const levels = derived(
  entities,
  $entities => filterByEntitytype($entities, ENTITY_TYPE.LEVEL) as Levels
)

// * * * * * * * * * * * * * * * * *
// PLAYER STORES
// * * * * * * * * * * * * * * * * *

export const playerAddress = writable("0x0" as string)

/**
 * Address in padded format
 */
export const playerId = derived(playerAddress, $playerAddress =>
  addressToId($playerAddress)
)

export const player = derived(
  [entities, playerId],
  ([$entities, $playerId]) => $entities[$playerId] as Player
)

export const othersRooms = derived(
  [playerId, rooms],
  ([$playerId, $rooms]) => filterByOthers($rooms, $playerId) as Rooms
)

export const playerRooms = derived(
  [playerId, rooms],
  ([$playerId, $rooms]) => filterByPlayer($rooms, $playerId) as Rooms
)

export const playerERC20Balance = writable(0 as number)

// * * * * * * * * * * * * * * * * *
// PLAYER RAT STORES
// * * * * * * * * * * * * * * * * *

export const rat = derived(
  [player, rats],
  ([$player, $rats]) => $rats[$player?.ownedRat] as Rat
)

export const ratTraits = derived(
  [rat, traits],
  ([$rat, $traits]) => $rat?.traits?.map(trait => $traits[trait]) as Trait[]
)

export const ratInventory = derived(
  [rat, items],
  ([$rat, $items]) => $rat?.inventory?.map(item => $items[item]) as Item[]
)

export const ratLevel = derived(
  [rat, levels],
  ([$rat, $levels]) => $levels[$rat?.level] as Level
)

export const ratLevelIndex = derived(
  [gameConfig, rat],
  ([$gameConfig, $rat]) => {
    if ($gameConfig?.levelList) {
      return $gameConfig.levelList.findIndex(lvl => lvl === ($rat?.level ?? 0))
    }
    return 0
  }
)

export const ratImageUrl = derived(
  [player],
  ([$player]) => {
    if (!$player?.ownedRat) return "/images/rat.png"
    return addressToRatImage($player.ownedRat)
  }
)

/**
 * Calculated by adding up the balance, health, inventory value and trait value
 */
export const ratTotalValue = derived(
  [rat, ratInventory, ratTraits],
  ([$rat, $ratInventory, $ratTraits]) => {
    const totalValue = !$rat
      ? 0
      : Number($rat.balance ?? 0) + // Balance
      Number($rat.health ?? 0) + // Health
      ($ratInventory ?? []).reduce(
        (acc, item) => acc + (Number(item?.value) ?? 0),
        0
      ) + // Inventory
      ($ratTraits ?? []).reduce(
        (acc, trait) => acc + (Number(trait?.value) ?? 0),
        0
      ) // Traits
    return totalValue
  }
)

export const roomsOnCurrentLevel = derived(
  [rat, rooms, gameConfig],
  ([$rat, $rooms, $gameConfig]) => {
    if (!$rat) {
      // Show room on first level if no rat
      // Assumes that the first element in the levelList is the first level...
      return filterByLevel($rooms, $gameConfig?.levelList[0]) as Rooms
    }
    return filterByLevel($rooms, $rat?.level) as Rooms
  }
)
