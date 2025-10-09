import { Player, GameConfig } from "@modules/types"
import {
  AuthorizationError,
  InsufficientBalanceError,
  InvalidPromptError,
  InvalidTripCreationCostError
} from "@modules/error-handling/errors"
import { MIN_TRIP_CREATION_COST } from "../../../config"

export function validateInputData(
  gameConfig: GameConfig,
  player: Player,
  tripPrompt: string,
  tripCreationCost: number
) {
  // Check if player has master key
  if (!player.masterKey) {
    throw new AuthorizationError()
  }

  // Check if trip creation cost is greater than minimum
  if (tripCreationCost < MIN_TRIP_CREATION_COST) {
    throw new InvalidTripCreationCostError()
  }

  // Check if player has enough balance to create a trip
  if (player.balance < tripCreationCost) {
    throw new InsufficientBalanceError("Not enough balance to create trip.")
  }

  // Check that the prompt is not empty and prompt is less than limit
  if (tripPrompt.length < 1 || tripPrompt.length > gameConfig.maxTripPromptLength) {
    throw new InvalidPromptError(
      `Trip prompt must be between 1 and ${gameConfig.maxTripPromptLength} characters.`
    )
  }
}
