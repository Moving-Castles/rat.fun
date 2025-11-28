/**
 * Entity Initialization
 *
 * Hydrates the entities store from MUD's initial sync data.
 * - Transfers component data from MUD indexer into Svelte stores
 * - Creates subscriptions for live updates on game-specific tables
 * - Additional filtering can be added here
 */

import { get } from "svelte/store"
import { publicNetwork } from "$lib/modules/network"
import { filterObjectByKey, toCamelCase, removePrivateKeys } from "$lib/modules/utils"
import { entities } from "$lib/modules/state/stores"
import { createComponentSystem } from "$lib/modules/chain-sync"

export function initEntities() {
  // Filter to only game-specific tables (excludes MUD system tables)
  const tableKeys = get(publicNetwork).tableKeys
  const filteredComponents = filterObjectByKey(get(publicNetwork).components, tableKeys)

  const syncEntities = {} as Entities

  for (let i = 0; i < tableKeys.length; i++) {
    const componentKey = tableKeys[i]
    const component = filteredComponents[componentKey]
    const propertyName = toCamelCase(componentKey)

    if (component?.values?.value) {
      // Single value component
      component.values.value.forEach((value: string | number | boolean | bigint, key: symbol) => {
        const entityKey = key.description as string
        // Create empty object if key is not present
        if (!syncEntities[entityKey]) {
          syncEntities[entityKey] = {} as Entity
        }
        // Set property
        syncEntities[entityKey][propertyName] = value
      })
    } else {
      // Struct component
      const cleanedStruct = removePrivateKeys(component.values)

      Object.entries(cleanedStruct).forEach(([key, value]) => {
        const structPropertyName = toCamelCase(key)
        value.forEach((structPropertyValue: string | number | bigint, key: symbol) => {
          const entityKey = key.description as string
          // Create empty object if key is not present
          if (!syncEntities[entityKey]) {
            syncEntities[entityKey] = {} as Entity
          }
          if (!syncEntities[entityKey][propertyName]) {
            ;(syncEntities[entityKey] as Record<string, unknown>)[propertyName] = {}
          }
          // Set property
          ;(syncEntities[entityKey][propertyName] as Record<string, unknown>)[structPropertyName] =
            structPropertyValue as Entity[string]
        })
      })
    }
  }

  // Additional filtering logic can be added here
  const filteredEntities = syncEntities

  // Single write to store
  entities.set(filteredEntities)

  // Create systems to listen to changes to game specific tables
  for (const componentKey of get(publicNetwork).tableKeys) {
    createComponentSystem(componentKey)
  }
}
