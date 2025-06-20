import { get } from "svelte/store"
import { publicNetwork } from "$lib/modules/network"
import {
  filterObjectByKey,
  toCamelCase,
  removePrivateKeys,
} from "$lib/modules/utils"
import { entities } from "$lib/modules/state/base/stores"
// import { playerAddress } from "$lib/modules/state/base/stores"
// import { addressToId } from "$lib/modules/utils"
import { createComponentSystem } from "$lib/modules/systems"

export function initEntities() {

  const tableKeys = get(publicNetwork).tableKeys

  // console.log("initEntities", tableKeys)

  // console.log('tableKeys', tableKeys) 

  const filteredComponents = filterObjectByKey(
    get(publicNetwork).components,
    tableKeys
  )

  // console.log('filteredComponents', filteredComponents)

  const syncEntities = {} as Entities

  for (let i = 0; i < tableKeys.length; i++) {
    const componentKey = tableKeys[i]
    // console.log('componentKey', componentKey)
    const component = filteredComponents[componentKey]
    // console.log('component', component)
    const propertyName = toCamelCase(componentKey)
    // console.log('propertyName', propertyName)

    // console.log('component?.values?.value', component.values.value)

    if (component?.values?.value) {
      // Single value component
      component.values.value.forEach((value: any, key: symbol) => {
        const entityKey = key.description as string
        // console.log('entityKey', entityKey)
        // Create empty object if key is not present
        if (!syncEntities[entityKey]) syncEntities[entityKey] = {} as Entity
        // Set property
        syncEntities[entityKey][propertyName] = value
      })
    } else {
      // Struct component
      const cleanedStruct = removePrivateKeys(component.values)

      Object.entries(cleanedStruct).forEach(([key, value]) => {
        const structPropertyName = toCamelCase(key)
        value.forEach((structPropertyValue: any, key: symbol) => {
          const entityKey = key.description as string
          // Create empty object if key is not present
          if (!syncEntities[entityKey]) syncEntities[entityKey] = {} as Entity
          if (!syncEntities[entityKey][propertyName])
            syncEntities[entityKey][propertyName] = {}
          // Set property
          syncEntities[entityKey][propertyName][structPropertyName] =
            structPropertyValue
        })
      })
    }
  }

  // const filteredEntities = filterEntities(syncEntities)
  const filteredEntities = syncEntities

  // console.log(' syncEntities',  syncEntities)

  // Single write to store
  entities.set(filteredEntities)

  // Create systems to listen to changes to game - specific tables
  for (const componentKey of get(publicNetwork).tableKeys) {
    // console.log('componentKey', componentKey)
    createComponentSystem(componentKey)
  }
}

// function filterEntities(syncEntities: Entities) {
//   const playerEntity = syncEntities[addressToId(get(playerAddress))]
//   if (!playerEntity) return syncEntities

//   const playerPodId = playerEntity.carriedBy
//   if (!playerPodId) return syncEntities

//   let filteredEntities = {} as Entities

//   // To matche: config, orders, offers, recipes and materials
//   const GLOBAL_TABLES = [
//     "gameConfig",
//     "order",
//     "offer",
//     "recipe",
//     "materialMetadata",
//   ]

//   Object.entries(syncEntities).forEach(([key, entity]) => {
//     if (hasCommonElement(GLOBAL_TABLES, Object.keys(entity))) {
//       // Global entites
//       filteredEntities[key] = entity
//     } else if (entity.entityType === ENTITY_TYPE.POD) {
//       // Pods
//       if (key == playerPodId) {
//         filteredEntities[key] = entity
//       }
//     } else if (entity.entityType == ENTITY_TYPE.MACHINE && entity.carriedBy) {
//       // Machines
//       if (entity.carriedBy == playerPodId) {
//         filteredEntities[key] = entity
//       }
//     } else if (entity.entityType == ENTITY_TYPE.TANK && entity.carriedBy) {
//       // Tanks
//       if (entity.carriedBy == playerPodId) {
//         filteredEntities[key] = entity
//       }
//     }
//   })

//   return filteredEntities
// }

// function hasCommonElement(arr1: string[], arr2: string[]): boolean {
//   const set1 = new Set(arr1)
//   return arr2.some(element => set1.has(element))
// }
