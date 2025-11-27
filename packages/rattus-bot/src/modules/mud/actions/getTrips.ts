import { getComponentValue, type Entity } from "@latticexyz/recs"
import type { SetupResult } from "../setup"
import type { Trip, Rat, Player, GameConfig, GamePercentagesConfig } from "../../../types"
import { singletonEntity } from "@latticexyz/store-sync/recs"
import { ENTITY_TYPE } from "contracts/enums"

/**
 * Get all available trips (balance > 0) from MUD state
 */
export function getAvailableTrips(mud: SetupResult): Trip[] {
  const { EntityType, Balance, Prompt, TripCreationCost, Owner, VisitCount, KillCount } =
    mud.components

  const trips: Trip[] = []

  // Iterate over all entities with EntityType component
  EntityType.values.value.forEach((entityType, entityKey) => {
    const entityId = entityKey.description as string

    if (entityType === ENTITY_TYPE.TRIP) {
      const balance = Number(getComponentValue(Balance, entityId as Entity)?.value ?? 0)

      // Only include trips with balance > 0
      if (balance > 0) {
        const prompt = (getComponentValue(Prompt, entityId as Entity)?.value ?? "") as string
        const tripCreationCost = Number(
          getComponentValue(TripCreationCost, entityId as Entity)?.value ?? 0
        )
        const owner = (getComponentValue(Owner, entityId as Entity)?.value ?? "") as string
        const visitCount = Number(getComponentValue(VisitCount, entityId as Entity)?.value ?? 0)
        const killCount = Number(getComponentValue(KillCount, entityId as Entity)?.value ?? 0)

        trips.push({
          id: entityId,
          prompt,
          balance,
          tripCreationCost,
          owner,
          visitCount,
          killCount
        })
      }
    }
  })

  return trips
}

/**
 * Get player data from MUD state
 */
export function getPlayer(mud: SetupResult, playerId: string): Player | null {
  const { Name, Balance, CurrentRat, EntityType } = mud.components

  // Check if entity exists by looking for EntityType (more reliable than Name)
  const entityTypeValue = getComponentValue(EntityType, playerId as Entity)
  const entityType = entityTypeValue?.value

  if (entityType !== ENTITY_TYPE.PLAYER) return null

  const name = (getComponentValue(Name, playerId as Entity)?.value ?? "Unknown") as string
  const balance = Number(getComponentValue(Balance, playerId as Entity)?.value ?? 0)
  const currentRat = (getComponentValue(CurrentRat, playerId as Entity)?.value ?? null) as
    | string
    | null

  return {
    id: playerId,
    name,
    balance,
    currentRat
  }
}

/**
 * Get rat data from MUD state
 */
export function getRat(mud: SetupResult, ratId: string): Rat | null {
  const { Name, Balance, Dead, Owner, TripCount, Inventory } = mud.components

  const name = getComponentValue(Name, ratId as Entity)?.value as string | undefined
  if (!name) return null

  const balance = Number(getComponentValue(Balance, ratId as Entity)?.value ?? 0)
  const dead = Boolean(getComponentValue(Dead, ratId as Entity)?.value ?? false)
  const owner = (getComponentValue(Owner, ratId as Entity)?.value ?? "") as string
  const tripCount = Number(getComponentValue(TripCount, ratId as Entity)?.value ?? 0)
  const inventory = (getComponentValue(Inventory, ratId as Entity)?.value ?? []) as string[]

  return {
    id: ratId,
    name,
    balance,
    dead,
    owner,
    tripCount,
    inventory
  }
}

/**
 * Get game config from MUD state
 */
export function getGameConfig(mud: SetupResult): GameConfig {
  const gameConfig = getComponentValue(mud.components.GameConfig, singletonEntity)
  if (!gameConfig) {
    throw new Error("GameConfig not found in MUD state")
  }

  return {
    ratCreationCost: Number(gameConfig.ratCreationCost),
    adminId: gameConfig.adminId as string
  }
}

/**
 * Get game percentages config from MUD state
 */
export function getGamePercentagesConfig(mud: SetupResult): GamePercentagesConfig {
  const config = getComponentValue(mud.components.GamePercentagesConfig, singletonEntity)
  if (!config) {
    throw new Error("GamePercentagesConfig not found in MUD state")
  }

  return {
    maxValuePerWin: Number(config.maxValuePerWin),
    minRatValueToEnter: Number(config.minRatValueToEnter)
  }
}

/**
 * Calculate total rat value (balance + inventory)
 */
export function getRatTotalValue(mud: SetupResult, rat: Rat): number {
  const { Value } = mud.components
  let totalValue = rat.balance

  for (const itemId of rat.inventory) {
    if (itemId) {
      const itemValue = Number(getComponentValue(Value, itemId as Entity)?.value ?? 0)
      totalValue += itemValue
    }
  }

  return totalValue
}

/**
 * Get inventory items with their names and values
 */
export function getInventoryDetails(mud: SetupResult, rat: Rat): { name: string; value: number }[] {
  const { Name, Value } = mud.components
  const items: { name: string; value: number }[] = []

  for (const itemId of rat.inventory) {
    if (itemId) {
      const name = (getComponentValue(Name, itemId as Entity)?.value ?? "Unknown") as string
      const value = Number(getComponentValue(Value, itemId as Entity)?.value ?? 0)
      items.push({ name, value })
    }
  }

  return items
}

/**
 * Check if rat can enter a trip based on minimum value requirement
 */
export function canRatEnterTrip(mud: SetupResult, rat: Rat, trip: Trip): boolean {
  const config = getGamePercentagesConfig(mud)
  const ratValue = getRatTotalValue(mud, rat)
  const minRequired = Math.floor((trip.tripCreationCost * config.minRatValueToEnter) / 100)
  return ratValue >= minRequired
}
