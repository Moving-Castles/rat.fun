import { Player, GameConfig, MinimalLevel } from "@modules/types"
import {
  AuthorizationError,
  InsufficientBalanceError,
  InvalidPromptError
} from "@modules/error-handling/errors"

export function validateInputData(
  gameConfig: GameConfig,
  roomPrompt: string,
  player: Player,
  level: MinimalLevel
) {
  // Only admin can create special rooms
  if (player.id !== gameConfig.adminId) {
    throw new AuthorizationError()
  }

  // Check if player has enough balance to create a room
  if (player.balance < Number(level.roomCreationCost)) {
    throw new InsufficientBalanceError("Not enough balance to create room.")
  }

  // Check that the prompt is not empty and prompt is less than limit
  if (roomPrompt.length < 1 || roomPrompt.length > gameConfig.maxRoomPromptLength) {
    throw new InvalidPromptError(
      `Room prompt must be between 1 and ${gameConfig.maxRoomPromptLength} characters.`
    )
  }
}
