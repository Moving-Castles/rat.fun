import { Player, GameConfig, MinimalLevel } from "@modules/types"
import {
  AuthorizationError,
  InsufficientBalanceError,
  InvalidLevelError,
  InvalidPromptError
} from "@modules/error-handling/errors"

export function validateInputData(
  gameConfig: GameConfig,
  roomPrompt: string,
  player: Player,
  level: MinimalLevel
) {
  // Check if player has master key
  if (!player.masterKey) {
    throw new AuthorizationError()
  }

  // Check if player has enough balance to create a room
  if (player.balance < Number(level.roomCreationCost)) {
    throw new InsufficientBalanceError("Not enough balance to create room.")
  }

  // Check if player has achieved the level
  if (!player.achievedLevels.includes(level.id)) {
    throw new InvalidLevelError()
  }

  // Check that the prompt is not empty and prompt is less than limit
  if (roomPrompt.length < 1 || roomPrompt.length > gameConfig.maxRoomPromptLength) {
    throw new InvalidPromptError(
      `Room prompt must be between 1 and ${gameConfig.maxRoomPromptLength} characters.`
    )
  }
}
