import { Player, GameConfig } from "@modules/types"
import {
  AuthorizationError,
  InsufficientBalanceError,
  InvalidPromptError,
  InvalidRoomCreationCostError
} from "@modules/error-handling/errors"
import { MIN_ROOM_CREATION_COST } from "../../../config"

export function validateInputData(
  gameConfig: GameConfig,
  player: Player,
  roomPrompt: string,
  roomCreationCost: number
) {
  // Check if player has master key
  if (!player.masterKey) {
    throw new AuthorizationError()
  }

  // Check if room creation cost is greater than minimum
  if (roomCreationCost < MIN_ROOM_CREATION_COST) {
    throw new InvalidRoomCreationCostError()
  }

  // Check if player has enough balance to create a room
  if (player.balance < roomCreationCost) {
    throw new InsufficientBalanceError("Not enough balance to create room.")
  }

  // Check that the prompt is not empty and prompt is less than limit
  if (roomPrompt.length < 1 || roomPrompt.length > gameConfig.maxRoomPromptLength) {
    throw new InvalidPromptError(
      `Room prompt must be between 1 and ${gameConfig.maxRoomPromptLength} characters.`
    )
  }
}
