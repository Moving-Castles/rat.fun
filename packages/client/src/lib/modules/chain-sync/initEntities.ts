/**
 * Entity Initialization
 *
 * Hydrates the entities store from MUD's initial sync data.
 * - Transfers component data from MUD indexer into Svelte stores
 * - Applies filtering to reduce client load (when activePlayerId provided)
 * - Creates subscriptions for live updates on game-specific tables
 */

import { get } from "svelte/store"
import { publicNetwork } from "$lib/modules/network"
import { filterObjectByKey, toCamelCase, removePrivateKeys } from "$lib/modules/utils"
import { entities } from "$lib/modules/state/stores"
import { createComponentSystem } from "$lib/modules/chain-sync"
import { logHydrationStats, trackComponentHydration } from "./tempDebugLogger"
import { ENTITY_TYPE } from "contracts/enums"

// ============================================================================
// ENTITY FILTERING
// ============================================================================
// Reduces client load by only syncing data the active player needs.
// Rules:
//   PLAYER: Active player gets all props, others get only entityType + name
//   RAT: Only sync active player's current rat
//   TRIP: Sync non-depleted trips (balance > 0) + active player's depleted trips
//   ITEM: Only sync items in active player's rat inventory

type FilterContext = {
  activePlayerId: string | null
  activePlayerCurrentRat: string | null
  activePlayerRatInventory: Set<string>
}

/**
 * Build filter context by extracting active player's rat and inventory from raw components.
 * Must be called before filtering since we need this info to filter other entities.
 */
function buildFilterContext(
  activePlayerId: string | null,
  filteredComponents: Record<string, any>
): FilterContext {
  if (!activePlayerId) {
    return {
      activePlayerId: null,
      activePlayerCurrentRat: null,
      activePlayerRatInventory: new Set()
    }
  }

  // Get active player's current rat from CurrentRat component
  let activePlayerCurrentRat: string | null = null
  const currentRatComponent = filteredComponents["CurrentRat"]
  if (currentRatComponent?.values?.value) {
    currentRatComponent.values.value.forEach((value: string, key: symbol) => {
      const entityKey = key.description as string
      if (entityKey === activePlayerId) {
        activePlayerCurrentRat = value
      }
    })
  }

  // Get inventory items from active player's rat
  const activePlayerRatInventory = new Set<string>()
  if (activePlayerCurrentRat) {
    const inventoryComponent = filteredComponents["Inventory"]
    if (inventoryComponent?.values?.value) {
      inventoryComponent.values.value.forEach((value: readonly string[], key: symbol) => {
        const entityKey = key.description as string
        if (entityKey === activePlayerCurrentRat) {
          value.forEach(itemId => activePlayerRatInventory.add(itemId))
        }
      })
    }
  }

  return { activePlayerId, activePlayerCurrentRat, activePlayerRatInventory }
}

/**
 * Determine if an entity should be synced based on filtering rules.
 * Returns { sync: boolean, fullSync: boolean }
 * - sync: whether to include entity at all
 * - fullSync: whether to include all properties (false = minimal props only)
 */
function shouldSyncEntity(
  entityKey: string,
  entity: Entity,
  context: FilterContext
): { sync: boolean; fullSync: boolean } {
  // No filtering if no active player context
  if (!context.activePlayerId) {
    return { sync: true, fullSync: true }
  }

  const entityType = entity.entityType

  switch (entityType) {
    case ENTITY_TYPE.PLAYER:
      // Active player: full sync. Others: sync with minimal props (handled in filtering)
      return {
        sync: true,
        fullSync: entityKey === context.activePlayerId
      }

    case ENTITY_TYPE.RAT:
      // Only sync active player's current rat
      return {
        sync: entityKey === context.activePlayerCurrentRat,
        fullSync: true
      }

    case ENTITY_TYPE.TRIP: {
      // Sync if: balance > 0 OR owned by active player (for history)
      const hasBalance = entity.balance !== undefined && entity.balance > 0n
      const ownedByPlayer = entity.owner === context.activePlayerId
      return {
        sync: hasBalance || ownedByPlayer,
        fullSync: true
      }
    }

    case ENTITY_TYPE.ITEM:
      // Only sync items in active player's rat inventory
      return {
        sync: context.activePlayerRatInventory.has(entityKey),
        fullSync: true
      }

    default:
      // Unknown or world entities: sync fully
      return { sync: true, fullSync: true }
  }
}

/**
 * Properties to keep for partially synced players (non-active players).
 */
const PLAYER_MINIMAL_PROPS = new Set(["entityType", "name"])

/**
 * Filter entity properties for partial sync.
 */
function filterEntityProps(entity: Entity, fullSync: boolean): Entity {
  if (fullSync) return entity

  // Partial sync: keep only minimal properties
  const filtered = {} as Entity
  for (const key of Object.keys(entity)) {
    if (PLAYER_MINIMAL_PROPS.has(key)) {
      filtered[key] = entity[key]
    }
  }
  return filtered
}

// ============================================================================
// MAIN INITIALIZATION
// ============================================================================

export type InitEntitiesOptions = {
  activePlayerId?: string | null
}

// Track initialization state to prevent duplicate calls
let initializedForPlayer: string | null = null

/**
 * Check if entities have been initialized for a specific player.
 */
export function isEntitiesInitialized(playerId?: string | null): boolean {
  if (!playerId) return initializedForPlayer !== null
  return initializedForPlayer === playerId
}

/**
 * Reset initialization state (for wallet disconnect/reconnect scenarios).
 */
export function resetEntitiesInitialization(): void {
  initializedForPlayer = null
  console.log("[initEntities] Reset - will reinitialize on next call")
}

export function initEntities(options: InitEntitiesOptions = {}) {
  const { activePlayerId = null } = options

  // Guard against duplicate initialization for same player
  if (activePlayerId && initializedForPlayer === activePlayerId) {
    console.log("[initEntities] Already initialized for player:", activePlayerId)
    return
  }

  // Filter to only game-specific tables (excludes MUD system tables)
  const tableKeys = get(publicNetwork).tableKeys
  const filteredComponents = filterObjectByKey(get(publicNetwork).components, tableKeys)

  // Build filter context (needs player's rat and inventory info)
  const filterContext = buildFilterContext(activePlayerId, filteredComponents)

  if (activePlayerId) {
    console.log("[initEntities] Filtering enabled for player:", activePlayerId)
    console.log("[initEntities] Active rat:", filterContext.activePlayerCurrentRat)
    console.log("[initEntities] Inventory items:", filterContext.activePlayerRatInventory.size)
  } else {
    console.log("[initEntities] No activePlayerId - syncing all entities")
  }

  const syncEntities = {} as Entities
  const componentBreakdown: Record<string, { entityCount: number; totalValues: number }> = {}

  // First pass: hydrate all entities from components
  for (let i = 0; i < tableKeys.length; i++) {
    const componentKey = tableKeys[i]
    const component = filteredComponents[componentKey]
    const propertyName = toCamelCase(componentKey)

    let entityCount = 0
    let totalValues = 0

    if (component?.values?.value) {
      // Single value component
      component.values.value.forEach((value: string | number | boolean | bigint, key: symbol) => {
        const entityKey = key.description as string
        if (!syncEntities[entityKey]) {
          syncEntities[entityKey] = {} as Entity
        }
        syncEntities[entityKey][propertyName] = value
        entityCount++
        totalValues++
      })
    } else {
      // Struct component
      const cleanedStruct = removePrivateKeys(component.values)
      const entityKeysInComponent = new Set<string>()

      Object.entries(cleanedStruct).forEach(([key, value]) => {
        const structPropertyName = toCamelCase(key)
        value.forEach((structPropertyValue: string | number | bigint, key: symbol) => {
          const entityKey = key.description as string
          entityKeysInComponent.add(entityKey)
          if (!syncEntities[entityKey]) {
            syncEntities[entityKey] = {} as Entity
          }
          if (!syncEntities[entityKey][propertyName]) {
            ;(syncEntities[entityKey] as Record<string, unknown>)[propertyName] = {}
          }
          ;(syncEntities[entityKey][propertyName] as Record<string, unknown>)[structPropertyName] =
            structPropertyValue as Entity[string]
          totalValues++
        })
      })
      entityCount = entityKeysInComponent.size
    }

    componentBreakdown[componentKey] = trackComponentHydration(
      componentKey,
      entityCount,
      totalValues
    )
  }

  // Second pass: apply entity filtering
  const finalEntities = {} as Entities
  let filteredOutCount = 0
  let partialSyncCount = 0

  for (const [entityKey, entity] of Object.entries(syncEntities)) {
    const { sync, fullSync } = shouldSyncEntity(entityKey, entity, filterContext)

    if (!sync) {
      filteredOutCount++
      continue
    }

    if (!fullSync) {
      partialSyncCount++
    }

    finalEntities[entityKey] = filterEntityProps(entity, fullSync)
  }

  // Log hydration stats (pre and post filtering)
  logHydrationStats(syncEntities, finalEntities, componentBreakdown, {
    filteredOutCount,
    partialSyncCount
  })

  // Single write to store
  entities.set(finalEntities)

  // Create systems to listen to changes to game specific tables
  for (const componentKey of get(publicNetwork).tableKeys) {
    createComponentSystem(componentKey)
  }

  // Mark as initialized for this player
  initializedForPlayer = activePlayerId
  console.log("[initEntities] Initialization complete for player:", activePlayerId)
}
