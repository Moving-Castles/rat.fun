/**
 * ========================================
 * state/utils.ts
 * ========================================
 * Utility functions for the on-chain entities of the game.
 */

import { Hex } from "viem"
import { ENTITY_TYPE } from "contracts/enums"
import { players, gameConfig, gamePercentagesConfig } from "$lib/modules/state/stores"
import { derived, get, Readable } from "svelte/store"
import { PropertyChangeTimeoutError, StoreTimeoutError } from "$lib/modules/error-handling/errors"
import { items } from "./stores"

/**
 * Filters entities by entity type
 * @param entities The entities to filter
 * @param entityType The entity type to filter by
 * @returns The filtered entities
 */
export function filterByEntitytype(entities: Entities, entityType: ENTITY_TYPE): Entities {
  return Object.fromEntries(
    Object.entries(entities).filter(([, entity]) => entity.entityType === entityType)
  )
}

/**
 * Filters trips by player
 * @param trips The trips to filter
 * @param playerId The player id to filter by
 * @returns The filtered trips
 */
export function filterByPlayer(trips: Trips, playerId: Hex): Trips {
  return Object.fromEntries(Object.entries(trips).filter(([, trip]) => trip.owner === playerId))
}

/**
 * Filters trips by active status
 * @param trips The trips to filter
 * @returns The filtered trips
 */
export function filterActive(trips: Trips): Trips {
  return Object.fromEntries(Object.entries(trips).filter(([, trip]) => !trip.liquidated))
}

/**
 * Filters trips by liquidation status
 * @param trips The trips to filter
 * @returns The filtered trips
 */
export function filterLiquidated(trips: Trips): Trips {
  return Object.fromEntries(Object.entries(trips).filter(([, trip]) => trip.liquidated))
}

/**
 * Filters trips by depletion status
 * @param trips The trips to filter
 * @returns The filtered trips
 */
export function filterDepleted(trips: Trips): Trips {
  return Object.fromEntries(Object.entries(trips).filter(([, trip]) => Number(trip.balance) === 0))
}

/**
 * Filters trips by depletion status
 * @param trips The trips to filter
 * @returns The filtered trips
 */
export function filterNonDepleted(trips: Trips): Trips {
  return Object.fromEntries(Object.entries(trips).filter(([, trip]) => Number(trip.balance) > 0))
}

/**
 * Filters trips by other player
 * @param trips The trips to filter
 * @param playerId The player id to filter by
 * @returns The filtered trips
 */
export function filterByOthers(trips: Trips, playerId: Hex): Trips {
  return Object.fromEntries(Object.entries(trips).filter(([, trip]) => trip.owner !== playerId))
}

/**
 * Checks if a trip is owned by a player
 * @param trip The trip to check
 * @param playerId The player id to check
 * @returns True if the trip is owned by the player, false otherwise
 */
export function isPlayerTrip(trip: Trip, playerId: Hex) {
  return trip.owner === playerId
}

/**
 * Gets the name of the owner of a trip
 * @param trip The trip to get the owner name of
 * @returns The name of the owner of the trip
 */
export function getTripOwnerName(trip: Trip) {
  if (trip.owner === get(gameConfig)?.adminId) {
    return "ratking"
  }
  return get(players)[trip.owner]?.name ?? "unknown"
}

export function getTripMaxValuePerWin(
  tripCreationCost: number | bigint,
  tripBalance: number | bigint
): Readable<number> {
  return derived(gamePercentagesConfig, $gamePercentagesConfig => {
    // Use balance or creation cost, whichever is higher
    const costBalanceMax = Math.max(Number(tripCreationCost), Number(tripBalance))
    // Multiply by the configured percentage
    const result = Math.floor(($gamePercentagesConfig.maxValuePerWin * costBalanceMax) / 100)
    // Cap to balance
    return Math.min(result, Number(tripBalance))
  })
}

export function getTripMinRatValueToEnter(tripCreationCost: number | bigint): Readable<number> {
  return derived(gamePercentagesConfig, $gamePercentagesConfig => {
    return Math.floor((Number(tripCreationCost) * $gamePercentagesConfig.minRatValueToEnter) / 100)
  })
}

/**
 * Gets the inventory of a rat
 * @param rat The rat to get the inventory of
 * @returns The inventory of the rat
 */
export function getRatInventory(rat: Rat | null) {
  if (!rat) {
    return [] as Item[]
  }
  const itemsStore = get(items)
  return rat.inventory?.map(item => itemsStore[item]) ?? ([] as Item[])
}

/**
 * Calculated total value of rat by adding up the balance and inventory value
 * @param rat The rat to calculate the total value of
 * @returns The total value of the rat
 */
export function getRatTotalValue(rat: Rat | null) {
  if (!rat) {
    return 0
  }
  const ratInventory = getRatInventory(rat)
  const totalValue =
    Number(rat.balance ?? 0) + // Balance
    ratInventory.reduce((acc, item) => acc + (item?.value ? Number(item.value) : 0), 0) // Inventory
  return totalValue
}

// * * * * * * * * * * * * * * * * *
// STORE UTILITY FUNCTIONS
// * * * * * * * * * * * * * * * * *

/**
 * Waits for a specific property in a store to change from an old value
 * @param store The Svelte store to watch
 * @param propertyPath The property path to watch (e.g., 'currentRat' or 'rat.balance')
 * @param oldValue The value to wait for to change from
 * @param timeoutMs Optional timeout in milliseconds (default: 30000)
 * @returns Promise that resolves with the new value when it changes
 */
export function waitForPropertyChange<T, K extends keyof T>(
  store: { subscribe: (callback: (value: T) => void) => () => void },
  propertyPath: K,
  oldValue: T[K] | undefined,
  timeoutMs: number = 30000
): Promise<T[K]> {
  return new Promise((resolve, reject) => {
    let unsubscribe: (() => void) | null = null

    const timeoutId = setTimeout(() => {
      if (unsubscribe) {
        unsubscribe()
      }
      reject(new PropertyChangeTimeoutError(String(propertyPath), timeoutMs))
    }, timeoutMs)

    unsubscribe = store.subscribe((value: T) => {
      const currentValue = value?.[propertyPath]
      if (currentValue !== undefined && currentValue !== oldValue) {
        clearTimeout(timeoutId)
        if (unsubscribe) {
          unsubscribe()
        }
        resolve(currentValue)
      }
    })
  })
}

// Stringify an object with BigInts (all crypto things have this)
export function stringifyWithBigInt(obj: unknown): string {
  return JSON.stringify(obj, (key, value) => {
    if (typeof value === "bigint") {
      return { __bigint: value.toString() }
    }
    return value
  })
}

// Parse a JSON string encoded with BigInt objects (see above)
export function parseWithBigInt(str: string): unknown {
  return JSON.parse(str, (key, value) => {
    if (value && typeof value === "object" && "__bigint" in value) {
      return BigInt(value.__bigint)
    }
    return value
  })
}

/**
 * Waits for a nested property in a store to change from an old value
 * @param store The Svelte store to watch
 * @param propertyPath The dot-separated property path (e.g., 'rat.balance')
 * @param oldValue The value to wait for to change from
 * @param timeoutMs Optional timeout in milliseconds (default: 30000)
 * @returns Promise that resolves with the new value when it changes
 */
export function waitForNestedPropertyChange(
  store: { subscribe: (callback: (value: unknown) => void) => () => void },
  propertyPath: string,
  oldValue: unknown,
  timeoutMs: number = 30000
): Promise<unknown> {
  return new Promise((resolve, reject) => {
    let unsubscribe: (() => void) | null = null

    const timeoutId = setTimeout(() => {
      if (unsubscribe) {
        unsubscribe()
      }
      reject(new PropertyChangeTimeoutError(propertyPath, timeoutMs))
    }, timeoutMs)

    unsubscribe = store.subscribe((value: unknown) => {
      const currentValue = propertyPath
        .split(".")
        .reduce((obj: unknown, key: string) => (obj as Record<string, unknown>)?.[key], value)
      if (currentValue !== undefined && currentValue !== oldValue) {
        clearTimeout(timeoutId)
        if (unsubscribe) {
          unsubscribe()
        }
        resolve(currentValue)
      }
    })
  })
}

/**
 * Waits for a store value to change from an old value
 * @param store The Svelte store to watch
 * @param oldValue The value to wait for to change from
 * @param timeoutMs Optional timeout in milliseconds (default: 30000)
 * @returns Promise that resolves with the new value when it changes
 */
export function waitForStoreChange<T>(
  store: { subscribe: (callback: (value: T) => void) => () => void },
  oldValue: T,
  timeoutMs: number = 30000
): Promise<T> {
  return new Promise((resolve, reject) => {
    let unsubscribe: (() => void) | null = null

    const timeoutId = setTimeout(() => {
      if (unsubscribe) {
        unsubscribe()
      }
      reject(
        new StoreTimeoutError(
          `Timeout waiting for store value to change from '${oldValue}'`,
          timeoutMs
        )
      )
    }, timeoutMs)

    unsubscribe = store.subscribe((value: T) => {
      if (value !== oldValue) {
        clearTimeout(timeoutId)
        if (unsubscribe) {
          unsubscribe()
        }
        resolve(value)
      }
    })
  })
}
