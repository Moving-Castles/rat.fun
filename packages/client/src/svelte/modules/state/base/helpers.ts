// TODO: move somewhere else

import { players, gameConfig } from "@modules/state/base/stores"
import { get } from "svelte/store"

export function getRoomOwnerName(room: Room) {

  if (room.owner === get(gameConfig)?.gameConfig?.adminId) {
    return "ratking"
  }

  return get(players)[room.owner]?.name ?? "unknown"
}
