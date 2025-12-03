import { get } from "svelte/store"
import { entities } from "$lib/modules/state/stores"
import { publicNetwork } from "$lib/modules/network"
import { toCamelCase } from "$lib/modules/utils"
import type { Component, ComponentUpdate } from "@latticexyz/recs"
import { deepEqual } from "@wagmi/core"

/**
 * Creates a reactive subscription for a single MUD component.
 * Listens to the component's update$ observable and syncs changes to the entities store.
 */
export function createComponentSystem(componentKey: string) {
  const components = get(publicNetwork).components as Record<string, Component>
  components[componentKey].update$.subscribe((update: ComponentUpdate) => {
    const [nextValue, prevValue] = update.value
    const entityID = update.entity as string

    // Abort if the values are exactly the same
    // In this case we assume this is directly after hydration from the indexer
    if (deepEqual(nextValue, prevValue)) {
      // logLiveUpdate(componentKey, entityID, "set", true, nextValue)
      return
    }

    const propertyName = toCamelCase(componentKey)

    // Single-value components have a "value" property, structs do not
    const newValue =
      nextValue && Object.prototype.hasOwnProperty.call(nextValue, "value")
        ? nextValue.value
        : nextValue

    // const operation = newValue === undefined ? "delete" : "set"
    // logLiveUpdate(componentKey, entityID, operation, false, newValue)

    entities.update(value => {
      // Create an empty entity if it does not exist
      if (value[entityID] === undefined) value[entityID] = {} as Entity

      // Set or delete
      if (newValue === undefined) {
        delete value[entityID][propertyName]
      } else {
        value[entityID][propertyName] = newValue
      }

      return value
    })
  })
}
