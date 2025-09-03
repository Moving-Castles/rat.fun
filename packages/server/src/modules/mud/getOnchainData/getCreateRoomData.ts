import type { CreateRoomData, GameConfig } from "@modules/types"
import { getComponentValue } from "@latticexyz/recs"
import { components, network } from "@modules/mud/initMud"
import { GAME_CONFIG_ID } from "@config"
import {
  OnchainDataError,
  PlayerNotFoundError,
  GameConfigNotFoundError
} from "@modules/error-handling/errors"

export async function getCreateRoomData(playerId: string): Promise<CreateRoomData> {
  try {
    if (!playerId) {
      throw new OnchainDataError("PLAYER_ID_REQUIRED", "Validation failed", "Player ID is required")
    }

    const { Name, RoomCreationCost, GameConfig, Prompt, MasterKey } = components

    const result = {} as CreateRoomData

    /////////////////
    // PLAYER
    /////////////////

    const playerEntity = (await network).world.registerEntity({ id: playerId })
    const playerName = getComponentValue(Name, playerEntity)?.value as string
    const playerMasterKey = getComponentValue(MasterKey, playerEntity)?.value as boolean

    const playerBalance = (await network.publicClient.readContract({
      address: network.worldContract.address,
      abi: network.worldContract.abi,
      functionName: "ratfun__balanceOf",
      args: [playerId]
    })) as bigint

    // Check if player exists
    if (!playerName) {
      throw new PlayerNotFoundError(playerId)
    }

    result.player = {
      id: playerId,
      name: playerName,
      balance: Number(playerBalance / 10n ** 18n),
      masterKey: playerMasterKey
    }

    /////////////////
    // GAME CONFIG
    /////////////////

    const gameConfigEntity = (await network).world.registerEntity({ id: GAME_CONFIG_ID })
    const gameConfig = getComponentValue(GameConfig, gameConfigEntity) as GameConfig

    // Check if game config exists
    if (!gameConfig) {
      throw new GameConfigNotFoundError(gameConfigEntity)
    }

    result.gameConfig = gameConfig

    /////////////////
    // RETURN RESULT
    /////////////////

    return result
  } catch (error) {
    // If it's already one of our custom errors, rethrow it
    if (error instanceof OnchainDataError) {
      throw error
    }

    // Otherwise, wrap it in our custom error
    throw new OnchainDataError(
      "ONCHAIN_DATA_ERROR",
      "Onchain data error",
      `Error fetching onchain data: ${error instanceof Error ? error.message : String(error)}`
    )
  }
}
