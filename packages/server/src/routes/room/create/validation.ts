import { Player, GameConfig, MinimalLevel } from "@modules/types";

export function validateInputData(gameConfig: GameConfig, roomPrompt: string, player: Player, level: MinimalLevel) {
    // Check if player has enough balance to create a room
    if (player.balance < Number(level.roomCreationCost)) {
        throw new Error('Not enough balance to create room.');
    }

    // Check if player has visited the level
    if (!player.visitedLevels.includes(level.id)) {
        throw new Error('Invalid level ID.');
    }

    // Check that the is not empty and prompt is less than limit
    if (roomPrompt.length < 1 || roomPrompt.length > gameConfig.maxRoomPromptLength) {
        throw new Error(`Room prompt must be between 1 and ${gameConfig.maxRoomPromptLength} characters.`);
    }
}