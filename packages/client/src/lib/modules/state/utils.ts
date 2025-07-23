/**
 * ========================================
 * state/utils.ts
 * ========================================
 * Utility functions for the on-chain entities of the game.
 */

import { Hex } from "viem"
import { ENTITY_TYPE } from "contracts/enums"
import { players, gameConfig } from "$lib/modules/state/stores"
import { get } from "svelte/store"
import { PropertyChangeTimeoutError, StoreTimeoutError } from "$lib/modules/error-handling/errors"

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
 * Filters rooms by level
 * @param rooms The rooms to filter
 * @param level The level to filter by
 * @returns The filtered rooms
 */
export function filterByLevel(rooms: Rooms, level: string): Rooms {
  return Object.fromEntries(Object.entries(rooms).filter(([, room]) => room.level === level))
}

/**
 * Filters rooms by player
 * @param rooms The rooms to filter
 * @param playerId The player id to filter by
 * @returns The filtered rooms
 */
export function filterByPlayer(rooms: Rooms, playerId: Hex): Rooms {
  return Object.fromEntries(Object.entries(rooms).filter(([, room]) => room.owner === playerId))
}

/**
 * Filters rooms by other player
 * @param rooms The rooms to filter
 * @param playerId The player id to filter by
 * @returns The filtered rooms
 */
export function filterByOthers(rooms: Rooms, playerId: Hex): Rooms {
  return Object.fromEntries(Object.entries(rooms).filter(([, room]) => room.owner !== playerId))
}

/**
 * Checks if a room is owned by a player
 * @param room The room to check
 * @param playerId The player id to check
 * @returns True if the room is owned by the player, false otherwise
 */
export function isPlayerRoom(room: Room, playerId: Hex) {
  return room.owner === playerId
}

/**
 * Gets the name of the owner of a room
 * @param room The room to get the owner name of
 * @returns The name of the owner of the room
 */
export function getRoomOwnerName(room: Room) {
  if (room.owner === get(gameConfig)?.adminId) {
    return "ratking"
  }
  return get(players)[room.owner]?.name ?? "unknown"
}

// * * * * * * * * * * * * * * * * *
// STORE UTILITY FUNCTIONS
// * * * * * * * * * * * * * * * * *

/**
 * Waits for a specific property in a store to change from an old value
 * @param store The Svelte store to watch
 * @param propertyPath The property path to watch (e.g., 'currentRat' or 'rat.health')
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

/**
 * Waits for a nested property in a store to change from an old value
 * @param store The Svelte store to watch
 * @param propertyPath The dot-separated property path (e.g., 'rat.health')
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
