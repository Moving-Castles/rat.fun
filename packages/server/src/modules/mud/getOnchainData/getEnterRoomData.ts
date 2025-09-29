import type { EnterRoomData, Item, GameConfig, GamePercentagesConfig, WorldEvent } from "@modules/types"
import { getComponentValue, Entity } from "@latticexyz/recs"
import { components, network } from "@modules/mud/initMud"
import { GAME_CONFIG_ID } from "@config"
import {
  OnchainDataError,
  RatNotFoundError,
  RoomNotFoundError,
  PlayerNotFoundError,
  GameConfigNotFoundError
} from "@modules/error-handling/errors"

export async function getEnterRoomData(
  ratId: string,
  roomId?: string,
  playerId?: string
): Promise<EnterRoomData> {
  try {
    if (!ratId) {
      throw new OnchainDataError("RAT_ID_REQUIRED", "Validation failed", "Rat ID is required")
    }

    const {
      Owner,
      Name,
      Prompt,
      WorldEvent,
      Dead,
      Balance,
      Inventory,
      Index,
      GameConfig,
      GamePercentagesConfig,
      RoomCreationCost,
    } = components

    const result = {} as EnterRoomData

    /////////////////
    // RAT
    /////////////////

    const ratEntity = (await network).world.registerEntity({ id: ratId })

    const ratOwner = getComponentValue(Owner, ratEntity)?.value as string
    const ratName = getComponentValue(Name, ratEntity)?.value as string

    // Check if rat exists
    if (!ratOwner && !ratName) {
      throw new RatNotFoundError(ratId)
    }

    // Get rat data
    const ratDead = Boolean(getComponentValue(Dead, ratEntity)?.value ?? false)
    const ratBalance = Number(getComponentValue(Balance, ratEntity)?.value ?? 0)
    const ratInventory = (getComponentValue(Inventory, ratEntity)?.value ?? [""]) as string[]
    const inventoryObjects = constructInventoryObject(ratInventory)

    const rat = {
      id: ratId,
      name: ratName,
      balance: Number(ratBalance),
      inventory: inventoryObjects,
      dead: ratDead,
      owner: ratOwner,
      totalValue: calculateTotalRatValue(Number(ratBalance), inventoryObjects)
    }

    result.rat = rat

    //////////////////
    // ROOM
    //////////////////

    // Only get room data if roomId is provided
    if (roomId) {
      // Get room data
      const roomEntity = (await network).world.registerEntity({ id: roomId })

      const roomPrompt = getComponentValue(Prompt, roomEntity)?.value as string

      // Check if room exists
      if (!roomPrompt) {
        throw new RoomNotFoundError(roomId)
      }

      const roomIndex = Number(getComponentValue(Index, roomEntity)?.value ?? 0)
      const roomBalance = Number(getComponentValue(Balance, roomEntity)?.value ?? 0)
      const roomCreationCost = Number(getComponentValue(RoomCreationCost, roomEntity)?.value ?? 0)

      const room = {
        id: roomId,
        prompt: roomPrompt,
        balance: roomBalance,
        roomCreationCost: roomCreationCost,
        index: roomIndex
      }

      result.room = room
    }

    //////////////////
    // PLAYER
    //////////////////

    // Only get player data if playerId is provided
    if (playerId) {
      const playerEntity = (await network).world.registerEntity({ id: playerId })

      const playerName = getComponentValue(Name, playerEntity)?.value as string
      const playerBalance = Number(getComponentValue(Balance, playerEntity)?.value ?? 0)

      // Check if player exists
      if (!playerName) {
        throw new PlayerNotFoundError(playerId)
      }

      result.player = {
        id: playerId,
        name: playerName,
        balance: playerBalance
      }
    }

    /////////////////
    // GAME CONFIG
    /////////////////

    const gameConfigEntity = (await network).world.registerEntity({ id: GAME_CONFIG_ID })

    const gameConfig = getComponentValue(GameConfig, gameConfigEntity) as GameConfig
    const gamePercentagesConfig = getComponentValue(GamePercentagesConfig, gameConfigEntity) as GamePercentagesConfig
    const worldEvent = getComponentValue(WorldEvent, gameConfigEntity) as WorldEvent

    // Check if game config exists
    if (!gameConfig || !gamePercentagesConfig) {
      throw new GameConfigNotFoundError(gameConfigEntity)
    }

    result.gameConfig = gameConfig
    result.gamePercentagesConfig = gamePercentagesConfig
    result.worldEvent = worldEvent

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

function constructInventoryObject(ratInventory: string[]) {
  const { Name, Value } = components
  const inventoryObject: Item[] = []
  for (let i = 0; i < ratInventory.length; i++) {
    if (!ratInventory[i]) continue
    inventoryObject.push({
      id: ratInventory[i],
      name: (getComponentValue(Name, ratInventory[i] as Entity)?.value ?? "") as string,
      value: Number(getComponentValue(Value, ratInventory[i] as Entity)?.value ?? 0)
    })
  }
  return inventoryObject
}

function calculateTotalRatValue(ratBalance: number, inventoryObjects: Item[]) {
  return ratBalance + inventoryObjects.reduce((acc, item) => acc + (item.value ?? 0), 0)
}
