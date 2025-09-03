import { Rat, Room, Player } from "@modules/types"
import {
  RatOwnershipError,
  RatDeadError,
  RoomBalanceError,
  RatValueError
} from "@modules/error-handling/errors"

export function validateInputData(player: Player, rat: Rat, room: Room) {
  // Check that sender owns the rat
  if (rat.owner !== player.id) {
    throw new RatOwnershipError()
  }

  // Check that the rat is alive
  if (rat.dead) {
    throw new RatDeadError()
  }

  // Check that the rat has enough value to enter the room
  if (rat.balance < room.minRatValueToEnter) {
    throw new RatValueError()
  }

  // Check that room balance is positive
  if (room.balance == 0) {
    throw new RoomBalanceError()
  }
}
