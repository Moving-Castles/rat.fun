import { Player, GameConfig } from "@modules/types"
import {
  AuthorizationError,
  InsufficientBalanceError,
  InvalidPromptError
} from "@modules/error-handling/errors"

export function validateInputData(
  gameConfig: GameConfig,
  player: Player,
  roomPrompt: string,
  roomCreationCost: number,
  maxValuePerWin: number,
  minRatValueToEnter: number
) {
  // Check if player has master key
  if (!player.masterKey) {
    throw new AuthorizationError()
  }

  // Check if player has enough balance to create a room
  if (player.balance < roomCreationCost) {
    throw new InsufficientBalanceError("Not enough balance to create room.")
  }

  // TODO: validate maxValuePerWin and minRatValueToEnter in relation to roomCreationCost

  // Check that the prompt is not empty and prompt is less than limit
  if (roomPrompt.length < 1 || roomPrompt.length > gameConfig.maxRoomPromptLength) {
    throw new InvalidPromptError(
      `Room prompt must be between 1 and ${gameConfig.maxRoomPromptLength} characters.`
    )
  }
}
