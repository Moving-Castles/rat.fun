import { Player, GameConfig } from "@modules/types"
import {
  AuthorizationError,
  InsufficientBalanceError,
  InvalidPromptError,
  InvalidTripCreationCostError,
  ValidationError
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

/**
 * Validate challenge trip parameters
 * @param isChallengeTrip - Whether this is a challenge trip
 * @param fixedMinValueToEnter - Fixed minimum rat value to enter
 * @param overrideMaxValuePerWinPercentage - Override max value per win percentage
 * @param isWhitelisted - Whether the user is whitelisted for challenge trips
 */
export function validateChallengeTripParams(
  isChallengeTrip: boolean | undefined,
  fixedMinValueToEnter: number | undefined,
  overrideMaxValuePerWinPercentage: number | undefined,
  isWhitelisted: boolean
) {
  if (!isChallengeTrip) {
    // If not a challenge trip, these values must not be set
    if (fixedMinValueToEnter && fixedMinValueToEnter > 0) {
      throw new ValidationError(
        "CHALLENGE_TRIP_PARAM_ERROR",
        "Validation failed",
        "fixedMinValueToEnter can only be set for challenge trips"
      )
    }
    if (overrideMaxValuePerWinPercentage && overrideMaxValuePerWinPercentage > 0) {
      throw new ValidationError(
        "CHALLENGE_TRIP_PARAM_ERROR",
        "Validation failed",
        "overrideMaxValuePerWinPercentage can only be set for challenge trips"
      )
    }
    return
  }

  // Challenge trip validation
  if (!isWhitelisted) {
    throw new AuthorizationError("Not whitelisted to create challenge trips")
  }

  if (!fixedMinValueToEnter || fixedMinValueToEnter <= 0) {
    throw new ValidationError(
      "CHALLENGE_TRIP_PARAM_ERROR",
      "Validation failed",
      "fixedMinValueToEnter must be greater than 0 for challenge trips"
    )
  }

  if (!overrideMaxValuePerWinPercentage || overrideMaxValuePerWinPercentage <= 0) {
    throw new ValidationError(
      "CHALLENGE_TRIP_PARAM_ERROR",
      "Validation failed",
      "overrideMaxValuePerWinPercentage must be greater than 0 for challenge trips"
    )
  }

  if (overrideMaxValuePerWinPercentage > 100) {
    throw new ValidationError(
      "CHALLENGE_TRIP_PARAM_ERROR",
      "Validation failed",
      "overrideMaxValuePerWinPercentage must be at most 100"
    )
  }
}
