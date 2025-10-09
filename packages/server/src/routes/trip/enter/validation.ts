import { Rat, Trip, Player, GamePercentagesConfig } from "@modules/types"
import {
  RatOwnershipError,
  RatDeadError,
  TripBalanceError,
  RatValueError
} from "@modules/error-handling/errors"
import { getTripMinRatValueToEnter } from "@modules/mud/value"

export function validateInputData(
  player: Player,
  rat: Rat,
  trip: Trip,
  gamePercentagesConfig: GamePercentagesConfig
) {
  // Check that sender owns the rat
  if (rat.owner !== player.id) {
    throw new RatOwnershipError()
  }

  // Check that the rat is alive
  if (rat.dead) {
    throw new RatDeadError()
  }

  // Check that the rat has enough value to enter the trip
  if (rat.totalValue < getTripMinRatValueToEnter(trip.tripCreationCost, gamePercentagesConfig)) {
    throw new RatValueError()
  }

  // Check that trip balance is positive
  if (trip.balance == 0) {
    throw new TripBalanceError()
  }
}
