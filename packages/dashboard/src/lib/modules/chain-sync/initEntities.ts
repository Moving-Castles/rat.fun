/**
 * ========================================
 *  modules/systems/initEntities.ts
 * ========================================
 * This module initializes the entities store.
 * It transfers the components given by MUD on startup into the svelte stores
 * It also creates systems to listen to changes to game specific tables
 * Additional filtering can be added here
 */

import { get } from "svelte/store"
import { publicNetwork } from "$lib/modules/network"
import { filterObjectByKey, toCamelCase, removePrivateKeys } from "$lib/modules/utils"
import { entities } from "$lib/modules/state/stores"
import { createComponentSystem } from "$lib/modules/chain-sync"

export function initEntities() {
  // Only sync game specific tables
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

  // console.log(`initEntities: ${Object.keys(filteredEntities).length} entities initialized`)

  // Create systems to listen to changes to game specific tables
  for (const componentKey of get(publicNetwork).tableKeys) {
    createComponentSystem(componentKey)
  }
}
