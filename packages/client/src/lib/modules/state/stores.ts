/*
 * ========================================
 * state/stores.ts
 * ========================================
 * Central store for all entities in the game.
 */

import { writable, derived } from "svelte/store"
import { addressToId } from "$lib/modules/utils"
import { blockNumber } from "$lib/modules/network"
import { ENTITY_TYPE } from "contracts/enums"
import {
  filterByEntitytype,
  filterByPlayer,
  filterByOthers,
  filterActive,
  filterLiquidated
} from "./utils"
import { staticContent } from "$lib/modules/content"
import { playerERC20Balance, playerERC20Allowance } from "$lib/modules/erc20Listener/stores"
import { WORLD_OBJECT_ID } from "./constants"

// * * * * * * * * * * * * * * * * *
// DEFAULT ENTITY TYPES
// * * * * * * * * * * * * * * * * *

/**
 * Mirror of the full on chain state.
 * Only ever written to via the update systems in module/ssystems
 */
export const entities = writable({} as Entities)

// * * * * * * * * * * * * * * * * *
// WORLD OBJECT ENTITIES
// * * * * * * * * * * * * * * * * *

export const worldObject = derived(
  entities,
  $entities => ($entities[WORLD_OBJECT_ID] || {}) as WorldObject
)

// GAME CONFIG
export const gameConfig = derived(worldObject, $worldObject => $worldObject.gameConfig)

// GAME PERCENTAGES CONFIG
export const gamePercentagesConfig = derived(
  worldObject,
  $worldObject => $worldObject.gamePercentagesConfig
)

// WORLD STATS
export const worldStats = derived(worldObject, $worldObject => $worldObject.worldStats)

// EXTERNAL ADDRESSES CONFIG
export const externalAddressesConfig = derived(
  worldObject,
  $worldObject => $worldObject.externalAddressesConfig
)

// WORLD EVENT
export const worldEvent = derived(worldObject, $worldObject => $worldObject.worldEvent)
export const activeWorldEvent = derived(
  [worldEvent, blockNumber],
  ([$worldEvent, $blockNumber]) => {
    if (!$worldEvent) {
      return undefined
    }
    if ($worldEvent.expirationBlock < $blockNumber) {
      return undefined
    }
    return $worldEvent
  }
)
export const activeWorldEventContent = derived(
  [staticContent, activeWorldEvent],
  ([$staticContent, $activeWorldEvent]) => {
    if (!$activeWorldEvent || !$staticContent.worldEvents) return undefined

    const event = $staticContent?.worldEvents.find(e => e._id === $activeWorldEvent.cmsId)

    if (event) {
      return event
    }

    return undefined
  }
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
export const items = derived(
  entities,
  $entities => filterByEntitytype($entities, ENTITY_TYPE.ITEM) as Items
)

// * * * * * * * * * * * * * * * * *
// PLAYER
// * * * * * * * * * * * * * * * * *

export const playerAddress = writable("0x0" as string)

/**
 * Address in padded format
 */
export const playerId = derived(playerAddress, $playerAddress => addressToId($playerAddress))

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

export const playerActiveRooms = derived([playerRooms], ([$playerRooms]) => {
  return filterActive($playerRooms) as Rooms
})

export const playerLiquidatedRooms = derived([playerRooms], ([$playerRooms]) => {
  return filterLiquidated($playerRooms) as Rooms
})

// Player does not and have never had a rat
export const playerIsNew = derived(
  player,
  $player => $player?.currentRat === undefined && ($player?.pastRats?.length ?? 0) === 0
)

// Player has few tokens
export const playerIsBroke = derived(
  playerERC20Balance,
  $playerERC20Balance => $playerERC20Balance < 100
)

// export const playerHasNotGivenTokenAllowance
export const tokenAllowanceApproved = derived(
  playerERC20Allowance,
  $playerERC20Allowance => $playerERC20Allowance > 0
)

// * * * * * * * * * * * * * * * * *
// PLAYER RAT
// * * * * * * * * * * * * * * * * *

export const rat = derived([player, rats], ([$player, $rats]) => $rats[$player?.currentRat] as Rat)

export const ratInventory = derived(
  [rat, items],
  ([$rat, $items]) => $rat?.inventory?.map(item => $items[item]) ?? ([] as Item[])
)

export const ratImageUrl = derived([player], ([$player]) => {
  return "/images/new-rat.png"
  // if (!$player?.currentRat) return "/images/rat.png"
  // return addressToRatImage($player.currentRat)
})

/**
 * Calculated by adding up the balance andinventory value
 */
export const ratTotalValue = derived([rat, ratInventory], ([$rat, $ratInventory]) => {
  const totalValue = !$rat
    ? 0
    : Number($rat.balance ?? 0) + // Balance
      $ratInventory.reduce((acc, item) => acc + (item?.value ? Number(item.value) : 0), 0) // Inventory
  return totalValue
})
