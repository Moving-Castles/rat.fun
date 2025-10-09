import { Hex } from "viem"
import type { CreateTripData, GameConfig } from "@modules/types"
import { getComponentValue } from "@latticexyz/recs"
import { network } from "@modules/mud/initMud"
import { singletonEntity } from "@latticexyz/store-sync/recs"
import {
  OnchainDataError,
  PlayerNotFoundError,
  GameConfigNotFoundError
} from "@modules/error-handling/errors"

export async function getCreateTripData(playerId: string): Promise<CreateTripData> {
  try {
    if (!playerId) {
      throw new OnchainDataError("PLAYER_ID_REQUIRED", "Validation failed", "Player ID is required")
    }

    const { Name, TripCreationCost, GameConfig, Prompt, MasterKey } = network.components

    const result = {} as CreateTripData

    /////////////////
    // PLAYER
    /////////////////

    const playerEntity = network.world.registerEntity({ id: playerId })
    const playerName = getComponentValue(Name, playerEntity)?.value as string
    const playerMasterKey = getComponentValue(MasterKey, playerEntity)?.value as boolean

    const playerBalance = (await network.publicClient.readContract({
      address: network.worldContract.address,
      abi: network.worldContract.abi,
      functionName: "ratfun__balanceOf",
      args: [playerId as Hex]
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

    const gameConfig = getComponentValue(GameConfig, singletonEntity) as GameConfig

    // Check if game config exists
    if (!gameConfig) {
      throw new GameConfigNotFoundError(singletonEntity)
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
