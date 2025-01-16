/*
 *  Central store for all entities in the game.
 *
 */
import type { FalseOrTransform } from "@modules/off-chain-sync/types"
import { writable, derived } from "svelte/store"
import { addressToId } from "@modules/utils"
import { ENTITY_TYPE } from "contracts/enums"
import { blockNumber } from "@svelte/modules/network"
import { COOLDOWN_PERIOD } from "./constants"
// import { GAME_CONFIG_ID } from "@modules/state/base/constants"

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

// export const gameConfig = derived(
//   entities,
//   $entities => ($entities[GAME_CONFIG_ID]?.gameConfig || {}) as GameConfig
// )

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

export const players = derived(entities, $entities => {
  const players = {} as Players
  Object.entries($entities).forEach(([key, value]) => {
    if (value.entityType === ENTITY_TYPE.PLAYER) {
      players[key] = value as Player
    }
  })
  return players
})

export const rats = derived(entities, $entities => {
  const rats = {} as Rats
  Object.entries($entities).forEach(([key, value]) => {
    if (value.entityType === ENTITY_TYPE.RAT) {
      rats[key] = value as Rat
    }
  })
  return rats
})

export const rooms = derived(entities, $entities => {
  const rooms = {} as Rooms
  Object.entries($entities).forEach(([key, value]) => {
    if (value.entityType === ENTITY_TYPE.ROOM) {
      rooms[key] = value as Room
    }
  })
  return rooms
})

export const traits = derived(entities, $entities => {
  const traits = {} as Traits
  Object.entries($entities).forEach(([key, value]) => {
    if (value.entityType === ENTITY_TYPE.TRAIT) {
      traits[key] = value as Trait
    }
  })
  return traits
})

// export const gameConfig = derived(entities, $entities => {
//   return ($entities[GAME_CONFIG_ID] || {}) as GameConfig
// })

// export const playerTransform = writable(false as FalseOrTransform)

// export const playerRemainingCooldown = derived(
//   [player, blockNumber],
//   ([$player, $blockNumber]) => {
//     if (!$player) return 0
//     return Math.max(
//       0,
//       (Number($player.cooldown) ?? 0) + COOLDOWN_PERIOD - Number($blockNumber)
//     )
//   }
// )

// export const actionAllowed = derived(
//   [player, blockNumber],
//   ([$player, $blockNumber]) => {
//     if (!$player) return false
//     return Number($player.cooldown) <= Number($blockNumber)
//   }
// )

// export const feeding = writable(false)
// export const shocking = writable(false)
