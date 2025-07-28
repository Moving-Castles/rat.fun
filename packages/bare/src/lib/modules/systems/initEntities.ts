import { get } from "svelte/store"
import { publicNetwork } from "$lib/modules/network"
import { filterObjectByKey, toCamelCase, removePrivateKeys } from "$lib/modules/utils"
import { entities } from "$lib/modules/state/stores"
import { createComponentSystem } from "$lib/modules/systems"

export function initEntities() {
  const tableKeys = get(publicNetwork).tableKeys
  const filteredComponents = filterObjectByKey(get(publicNetwork).components, tableKeys)
  const syncEntities = {} as Entities
  for (let i = 0; i < tableKeys.length; i++) {
    const componentKey = tableKeys[i]
    const component = filteredComponents[componentKey]
    const propertyName = toCamelCase(componentKey)
    if (component?.values?.value) {
      component.values.value.forEach((value: any, key: symbol) => {
        const entityKey = key.description as string
        if (!syncEntities[entityKey]) syncEntities[entityKey] = {} as Entity
        syncEntities[entityKey][propertyName] = value
      })
    } else {
      const cleanedStruct = removePrivateKeys(component.values)
      Object.entries(cleanedStruct).forEach(([key, value]) => {
        const structPropertyName = toCamelCase(key)
        value.forEach((structPropertyValue: any, key: symbol) => {
          const entityKey = key.description as string
          if (!syncEntities[entityKey]) syncEntities[entityKey] = {} as Entity
          if (!syncEntities[entityKey][propertyName]) syncEntities[entityKey][propertyName] = {}
          syncEntities[entityKey][propertyName][structPropertyName] = structPropertyValue
        })
      })
    }
  }
  const filteredEntities = syncEntities
  entities.set(filteredEntities)
  for (const componentKey of get(publicNetwork).tableKeys) {
    createComponentSystem(componentKey)
  }
}
