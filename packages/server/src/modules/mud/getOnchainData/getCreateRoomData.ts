import type { CreateRoomData, GameConfig } from "@modules/types";
import { getComponentValue, Entity } from "@latticexyz/recs";
import { components, network } from "@modules/mud/initMud";
import { GAME_CONFIG_ID } from "@config";

// Custom error classes for better error handling
export class OnchainDataError extends Error {
  constructor(message: string, public code: string = 'ONCHAIN_DATA_ERROR') {
    super(message);
    this.name = 'OnchainDataError';
  }
}

export class PlayerNotFoundError extends OnchainDataError {
  constructor(playerId: string) {
    super(`Player with ID ${playerId} not found`, 'PLAYER_NOT_FOUND');
    this.name = 'PlayerNotFoundError';
  }
}

export class GameConfigNotFoundError extends OnchainDataError {
  constructor(gameConfigEntity: Entity) {
    super(`Game config not found for entity ${gameConfigEntity}`, 'GAME_CONFIG_NOT_FOUND');
    this.name = 'GameConfigNotFoundError';
  }
}

export class LevelNotFoundError extends OnchainDataError {
  constructor(levelId: string) {
    super(`Level not found for id ${levelId}`, 'LEVEL_NOT_FOUND');
    this.name = 'LevelNotFoundError';
  }
}

export async function getCreateRoomData(playerId: string, levelId: string): Promise<CreateRoomData> {
    try {
        if (!playerId) {
          throw new OnchainDataError('Player ID is required');
        }

        const { 
          Name, 
          Balance, 
          VisitedLevels, 
          RoomCreationCost,
          GameConfig,
          Prompt
        } = components;

        const result = {} as CreateRoomData;

        /////////////////
        // PLAYER
        /////////////////

        const playerEntity = (await network).world.registerEntity({ id: playerId });

        const playerName = getComponentValue(Name, playerEntity)?.value as string;
        const playerBalance = Number(getComponentValue(Balance, playerEntity)?.value);
        const playerVisitedLevels = getComponentValue(VisitedLevels, playerEntity)?.value as string[];

        // Check if player exists
        if (!playerName) {
          throw new PlayerNotFoundError(playerId);
        }

        result.player = {
          id: playerId,
          name: playerName,
          balance: playerBalance,
          visitedLevels: playerVisitedLevels
        }

        /////////////////
        // GAME CONFIG
        /////////////////

        const gameConfigEntity = (await network).world.registerEntity({ id: GAME_CONFIG_ID });

        const gameConfig = getComponentValue(GameConfig, gameConfigEntity) as GameConfig;

        // Check if game config exists
        if (!gameConfig) {
          throw new GameConfigNotFoundError(gameConfigEntity);
        }

        result.gameConfig = gameConfig;

        /////////////////
        // LEVEL
        /////////////////

        const levelEntity = (await network).world.registerEntity({ id: levelId });

        const levelRoomCreationCost = getComponentValue(RoomCreationCost, levelEntity)?.value as number;
        const levelPrompt = getComponentValue(Prompt, levelEntity)?.value as string;

        if(!levelRoomCreationCost) {
          throw new LevelNotFoundError(levelId);
        }

        const level = {
            id: levelId,
            roomCreationCost: levelRoomCreationCost,
            prompt: levelPrompt
        };

        result.level = level;

        /////////////////
        // RETURN RESULT
        /////////////////
        return result;
    } catch (error) {
        // If it's already one of our custom errors, rethrow it
        if (error instanceof OnchainDataError) {
          throw error;
        }
        
        // Otherwise, wrap it in our custom error
        throw new OnchainDataError(`Error fetching onchain data: ${error instanceof Error ? error.message : String(error)}`);
    }
}