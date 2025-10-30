import type {
  EnterTripData,
  Item,
  GameConfig,
  GamePercentagesConfig,
  WorldEvent
} from "@modules/types"
import { getComponentValue, type Entity } from "@latticexyz/recs"
import { network } from "@modules/mud/initMud"
import { singletonEntity } from "@latticexyz/store-sync/recs"
import { retryUntilResult } from "@modules/utils"
import {
  OnchainDataError,
  RatNotFoundError,
  TripNotFoundError,
  PlayerNotFoundError,
  GameConfigNotFoundError
} from "@modules/error-handling/errors"

export async function getEnterTripData(
  ratId: string,
  tripId?: string,
  playerId?: string
): Promise<EnterTripData> {
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
      TripCreationCost
    } = network.components

    const result = {} as EnterTripData

    /////////////////
    // RAT
    /////////////////

    // Use entity ID directly - no need to register entity (prevents memory leak)
    const ratEntity = ratId as Entity

    console.log("ratId", ratId)
    console.log("ratEntity", ratEntity)

    // Retry until the rat owner is found or the timeout is reached
    // If a rat is sent in quickly after creation, the owner may not be set yet
    // We assume if the owner is set the other values are also set
    const ratOwnerResult = await retryUntilResult(
      () => getComponentValue(Owner, ratEntity),
      8000,
      100,
      result => result !== undefined && result !== null
    )
    const ratOwner = ratOwnerResult?.value as string

    console.log("ratOwner", ratOwner)

    // Check if rat exists
    if (!ratOwner) {
      throw new RatNotFoundError(ratId)
    }

    // Get rat data
    const ratName = getComponentValue(Name, ratEntity)?.value as string
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
    // TRIP
    //////////////////

    // Only get trip data if tripId is provided
    if (tripId) {
      // Get trip data - use entity ID directly (prevents memory leak)
      const tripEntity = tripId as Entity

      const tripPrompt = getComponentValue(Prompt, tripEntity)?.value as string

      // Check if trip exists
      if (!tripPrompt) {
        throw new TripNotFoundError(tripId)
      }

      const tripIndex = Number(getComponentValue(Index, tripEntity)?.value ?? 0)
      const tripBalance = Number(getComponentValue(Balance, tripEntity)?.value ?? 0)
      const tripCreationCost = Number(getComponentValue(TripCreationCost, tripEntity)?.value ?? 0)

      const trip = {
        id: tripId,
        prompt: tripPrompt,
        balance: tripBalance,
        tripCreationCost: tripCreationCost,
        index: tripIndex
      }

      result.trip = trip
    }

    //////////////////
    // PLAYER
    //////////////////

    // Only get player data if playerId is provided
    if (playerId) {
      // Use entity ID directly (prevents memory leak)
      const playerEntity = playerId as Entity

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

    const gameConfig = getComponentValue(GameConfig, singletonEntity) as GameConfig
    const gamePercentagesConfig = getComponentValue(
      GamePercentagesConfig,
      singletonEntity
    ) as GamePercentagesConfig
    const worldEvent = getComponentValue(WorldEvent, singletonEntity) as WorldEvent

    // Check if game config exists
    if (!gameConfig || !gamePercentagesConfig) {
      throw new GameConfigNotFoundError(singletonEntity)
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
  const { Name, Value } = network.components
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
