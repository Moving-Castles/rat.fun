/*
 * ========================================
 * state/stores.ts
 * ========================================
 * Central store for all entities in the game.
 */

import { writable, derived } from "svelte/store"
import { addressToId, addressToRatImage } from "$lib/modules/utils"
import { blockNumber } from "$lib/modules/network"
import { ENTITY_TYPE } from "contracts/enums"
import { filterByEntitytype, filterByLevel, filterByPlayer, filterByOthers } from "./utils"
import { staticContent } from "$lib/modules/content"
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

// WORLD STATS
export const worldStats = derived(worldObject, $worldObject => $worldObject.worldStats)

// EXTERNAL ADDRESSES CONFIG
export const externalAddressesConfig = derived(
  worldObject,
  $worldObject => $worldObject.externalAddressesConfig
)

// LEVEL LIST
export const levelList = derived(worldObject, $worldObject => $worldObject.levelList)

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
export const levels = derived(
  entities,
  $entities => filterByEntitytype($entities, ENTITY_TYPE.LEVEL) as Levels
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

export const playerERC20Balance = writable(0 as number)
export const playerERC20Allowance = writable(0 as number)

// * * * * * * * * * * * * * * * * *
// PLAYER RAT
// * * * * * * * * * * * * * * * * *

export const rat = derived([player, rats], ([$player, $rats]) => $rats[$player?.currentRat] as Rat)

export const ratInventory = derived(
  [rat, items],
  ([$rat, $items]) => $rat?.inventory?.map(item => $items[item]) ?? ([] as Item[])
)

export const ratLevel = derived([rat, levels], ([$rat, $levels]) => $levels[$rat?.level] as Level)

export const ratLevelIndex = derived([levelList, rat], ([$levelList, $rat]) => {
  if ($levelList) {
    return $levelList?.findIndex(lvl => lvl === ($rat?.level ?? 0))
  }
  return 0
})

export const ratImageUrl = derived([player], ([$player]) => {
  if (!$player?.currentRat) return "/images/rat.png"
  return addressToRatImage($player.currentRat)
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

export const roomsOnCurrentLevel = derived(
  [rat, rooms, levelList],
  ([$rat, $rooms, $levelList]) => {
    if (!$rat) {
      // Show room on first level if no rat
      // Assumes that the first element in the levelList is the first level...
      return filterByLevel($rooms, $levelList?.[0]) as Rooms
    }
    return filterByLevel($rooms, $rat?.level) as Rooms
  }
)
