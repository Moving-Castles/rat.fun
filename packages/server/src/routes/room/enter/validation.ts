import { Rat, Room, Player, GamePercentagesConfig } from "@modules/types"
import {
  RatOwnershipError,
  RatDeadError,
  RoomBalanceError,
  RatValueError
} from "@modules/error-handling/errors"
import { getRoomMinRatValueToEnter } from "@modules/mud/value"

export function validateInputData(player: Player, rat: Rat, room: Room, gamePercentagesConfig: GamePercentagesConfig) {
  // Check that sender owns the rat
  if (rat.owner !== player.id) {
    throw new RatOwnershipError()
  }

  // Check that the rat is alive
  if (rat.dead) {
    throw new RatDeadError()
  }

  // Check that the rat has enough value to enter the room
  if (rat.totalValue < getRoomMinRatValueToEnter(room.roomCreationCost, gamePercentagesConfig)) {
    throw new RatValueError()
  }

  // Check that room balance is positive
  if (room.balance == 0) {
    throw new RoomBalanceError()
  }
}
