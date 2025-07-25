import type { EnterRoomData, Trait, Item, GameConfig, WorldEvent } from "@modules/types"
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
      Traits,
      Balance,
      Inventory,
      Index,
      GameConfig,
      Level,
      AchievedLevels,
      LevelMinBalance,
      LevelMaxBalance,
      RoomCreationCost,
      IsSpecialRoom,
      MaxValuePerWin
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
    const ratDead = (getComponentValue(Dead, ratEntity)?.value ?? false) as boolean
    const ratBalance = (getComponentValue(Balance, ratEntity)?.value ?? 0) as number
    const ratInventory = (getComponentValue(Inventory, ratEntity)?.value ?? [""]) as string[]
    const ratTraits = (getComponentValue(Traits, ratEntity)?.value ?? [""]) as string[]
    const ratLevel = (getComponentValue(Level, ratEntity)?.value ?? "") as string

    const traitsObjects = constructTraitsObject(ratTraits)
    const inventoryObjects = constructInventoryObject(ratInventory)

    const rat = {
      id: ratId,
      name: ratName,
      level: ratLevel,
      traits: traitsObjects,
      balance: Number(ratBalance),
      inventory: inventoryObjects,
      dead: ratDead,
      owner: ratOwner
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

      const roomIndex = (getComponentValue(Index, roomEntity)?.value ?? 0) as number
      const roomBalance = (getComponentValue(Balance, roomEntity)?.value ?? 0) as number
      const roomLevel = (getComponentValue(Level, roomEntity)?.value ?? "") as string
      const isSpecialRoom = (getComponentValue(IsSpecialRoom, roomEntity)?.value ??
        false) as boolean
      const roomMaxValuePerWin = (getComponentValue(MaxValuePerWin, roomEntity)?.value ??
        0) as number

      const room = {
        id: roomId,
        prompt: roomPrompt,
        level: roomLevel,
        balance: Number(roomBalance),
        index: roomIndex,
        isSpecialRoom,
        maxValuePerWin: roomMaxValuePerWin
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
      const playerAchievedLevels = getComponentValue(AchievedLevels, playerEntity)
        ?.value as string[]

      // Check if player exists
      if (!playerName) {
        throw new PlayerNotFoundError(playerId)
      }

      result.player = {
        id: playerId,
        name: playerName,
        balance: playerBalance,
        achievedLevels: playerAchievedLevels
      }
    }

    /////////////////
    // LEVEL
    /////////////////

    const levelEntity = (await network).world.registerEntity({ id: ratLevel })

    const levelIndex = getComponentValue(Index, levelEntity)?.value as number
    const levelMinBalance = getComponentValue(LevelMinBalance, levelEntity)?.value as number
    const levelMaxBalance = getComponentValue(LevelMaxBalance, levelEntity)?.value as number
    const levelRoomCreationCost = getComponentValue(RoomCreationCost, levelEntity)?.value as number

    const level = {
      id: ratLevel,
      index: levelIndex,
      minBalance: levelMinBalance,
      maxBalance: levelMaxBalance,
      roomCreationCost: levelRoomCreationCost
    }

    result.level = level

    /////////////////
    // GAME CONFIG
    /////////////////

    const gameConfigEntity = (await network).world.registerEntity({ id: GAME_CONFIG_ID })

    const gameConfig = getComponentValue(GameConfig, gameConfigEntity) as GameConfig
    const worldEvent = getComponentValue(WorldEvent, gameConfigEntity) as WorldEvent

    // Check if game config exists
    if (!gameConfig) {
      throw new GameConfigNotFoundError(gameConfigEntity)
    }

    result.gameConfig = gameConfig
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

function constructTraitsObject(ratTraits: string[]) {
  const { Name, Value } = components
  const traitsObject: Trait[] = []
  for (let i = 0; i < ratTraits.length; i++) {
    if (!ratTraits[i]) continue
    traitsObject.push({
      id: ratTraits[i],
      name: (getComponentValue(Name, ratTraits[i] as Entity)?.value ?? "") as string,
      value: Number(getComponentValue(Value, ratTraits[i] as Entity)?.value ?? 0) as number
    })
  }
  return traitsObject
}

function constructInventoryObject(ratInventory: string[]) {
  const { Name, Value } = components
  const inventoryObject: Item[] = []
  for (let i = 0; i < ratInventory.length; i++) {
    if (!ratInventory[i]) continue
    inventoryObject.push({
      id: ratInventory[i],
      name: (getComponentValue(Name, ratInventory[i] as Entity)?.value ?? "") as string,
      value: Number(getComponentValue(Value, ratInventory[i] as Entity)?.value ?? 0) as number
    })
  }
  return inventoryObject
}
