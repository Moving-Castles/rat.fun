/**
 * ========================================
 * state/base/utils.ts
 * ========================================
 * Utility functions for the on-chain entities of the game.
 */

import { Hex } from "viem"
import { ENTITY_TYPE } from "./enums"
import { players, gameConfig } from "$lib/modules/state/base/stores"
import { get } from "svelte/store"

/**
 * Filters entities by entity type
 * @param entities The entities to filter
 * @param entityType The entity type to filter by
 * @returns The filtered entities
 */
export function filterByEntitytype(
  entities: Entities,
  entityType: ENTITY_TYPE
): Entities {
  return Object.fromEntries(
    Object.entries(entities).filter(
      ([, entity]) => entity.entityType === entityType
    )
  )
}

/**
 * Filters rooms by level
 * @param rooms The rooms to filter
 * @param level The level to filter by
 * @returns The filtered rooms
 */
export function filterByLevel(rooms: Rooms, level: string): Rooms {
  return Object.fromEntries(
    Object.entries(rooms).filter(([, room]) => room.level === level)
  )
}

/**
 * Filters rooms by player
 * @param rooms The rooms to filter
 * @param playerId The player id to filter by
 * @returns The filtered rooms
 */
export function filterByPlayer(rooms: Rooms, playerId: Hex): Rooms {
  return Object.fromEntries(
    Object.entries(rooms).filter(([, room]) => room.owner === playerId)
  )
}

/**
 * Filters rooms by other player
 * @param rooms The rooms to filter
 * @param playerId The player id to filter by
 * @returns The filtered rooms
 */
export function filterByOthers(rooms: Rooms, playerId: Hex): Rooms {
  return Object.fromEntries(
    Object.entries(rooms).filter(([, room]) => room.owner !== playerId)
  )
}


/**
 * Checks if a room is owned by a player
 * @param room The room to check
 * @param playerId The player id to check
 * @returns True if the room is owned by the player, false otherwise
 */
export function isPlayerRoom(room: Room, playerId: Hex) {
  return room.owner === playerId
}

/**
 * Gets the name of the owner of a room
 * @param room The room to get the owner name of
 * @returns The name of the owner of the room
 */
export function getRoomOwnerName(room: Room) {
  if (room.owner === get(gameConfig)?.gameConfig?.adminId) {
    return "ratking"
  }
  return get(players)[room.owner]?.name ?? "unknown"
}

