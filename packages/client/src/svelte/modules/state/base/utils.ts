import { Hex } from "viem"
import { ENTITY_TYPE } from "./enums"
import { players, gameConfig } from "@modules/state/base/stores"
import { get } from "svelte/store"

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

export function filterByLevel(rooms: Rooms, level: string): Rooms {
  return Object.fromEntries(
    Object.entries(rooms).filter(([, room]) => room.level === level)
  )
}

export function filterByPlayer(rooms: Rooms, playerId: Hex): Rooms {
  return Object.fromEntries(
    Object.entries(rooms).filter(([, room]) => room.owner === playerId)
  )
}

export function filterByOthers(rooms: Rooms, playerId: Hex): Rooms {
  return Object.fromEntries(
    Object.entries(rooms).filter(([, room]) => room.owner !== playerId)
  )
}

export function isPlayerRoom(room: Room, playerId: Hex) {
  return room.owner === playerId
}

export function getRoomOwnerName(room: Room) {

  if (room.owner === get(gameConfig)?.gameConfig?.adminId) {
    return "ratking"
  }

  return get(players)[room.owner]?.name ?? "unknown"
}

