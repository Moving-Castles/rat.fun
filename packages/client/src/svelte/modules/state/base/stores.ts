/*
 *  Central store for all entities in the game.
 *
 */
import { writable, derived } from "svelte/store"
import { addressToId } from "@modules/utils"
import { ENTITY_TYPE } from "contracts/enums"
import { filterByEntitytype } from "./utils"
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
  $entities => ($entities[GAME_CONFIG_ID]?.gameConfig || {}) as GameConfig
)

// * * * * * * * * * * * * * * * * *
// GAME ELEMENT STORES
// * * * * * * * * * * * * * * * * *

export const players = derived(entities, $entities => filterByEntitytype($entities, ENTITY_TYPE.PLAYER) as Players)
export const rats = derived(entities, $entities => filterByEntitytype($entities, ENTITY_TYPE.RAT) as Rats)
export const rooms = derived(entities, $entities => filterByEntitytype($entities, ENTITY_TYPE.ROOM) as Rooms)
export const traits = derived(entities, $entities => filterByEntitytype($entities, ENTITY_TYPE.TRAIT) as Traits)
export const items = derived(entities, $entities => filterByEntitytype($entities, ENTITY_TYPE.ITEM) as Items)

// * * * * * * * * * * * * * * * * *
// PLAYER STORES
// * * * * * * * * * * * * * * * * *

export const playerAddress = writable("0x0" as string)

// Address in padded format
export const playerId = derived(playerAddress, $playerAddress =>
  addressToId($playerAddress)
)

export const player = derived(
  [entities, playerId],
  ([$entities, $playerId]) => $entities[$playerId] as Player
)

export const playerInventory = derived(
  [player, items],
  ([$player, $items]) => $player?.inventory?.map(item => $items[item]) as Item[]
)

// * * * * * * * * * * * * * * * * *
// PLAYER RAT STORES
// * * * * * * * * * * * * * * * * *

export const playerRat = derived(
  [player, rats],
  ([$player, $rats]) => $rats[$player?.ownedRat] as Rat
)

export const playerRatTraits = derived(
  [playerRat, traits],
  ([$playerRat, $traits]) => $playerRat?.traits?.map(trait => $traits[trait]) as Trait[]
)

export const playerRatLoadOut = derived(
  [playerRat, items],
  ([$playerRat, $items]) => $playerRat?.loadOut?.map(item => $items[item]) as Item[]
)
