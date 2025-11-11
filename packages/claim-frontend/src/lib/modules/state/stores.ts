/*
 * ========================================
 * state/stores.ts
 * ========================================
 * Central store for all entities in the game.
 */

import { writable, derived } from "svelte/store"
import { addressToId } from "$lib/modules/utils"
import { ENTITY_TYPE } from "contracts/enums"
import { filterByEntitytype, filterByPlayer } from "./utils"
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
export const trips = derived(
  entities,
  $entities => filterByEntitytype($entities, ENTITY_TYPE.TRIP) as Trips
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

export const playerTrips = derived(
  [playerId, trips],
  ([$playerId, $trips]) => filterByPlayer($trips, $playerId) as Trips
)

// Player does not and have never had a rat
export const playerIsNew = derived(
  player,
  $player => $player?.currentRat === undefined && ($player?.pastRats?.length ?? 0) === 0
)

// Player has few tokens
export const playerHasTokens = derived(
  playerERC20Balance,
  $playerERC20Balance => $playerERC20Balance > 0
)

// export const playerHasNotGivenTokenAllowance
export const tokenAllowanceApproved = derived(
  playerERC20Allowance,
  $playerERC20Allowance => $playerERC20Allowance > 0
)
