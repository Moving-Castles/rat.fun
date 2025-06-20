import { get } from "svelte/store"
import { entities } from "$lib/modules/state/base/stores"
import { publicNetwork } from "$lib/modules/network"
import { toCamelCase } from "$lib/modules/utils"
import { ComponentUpdate } from "@latticexyz/recs"
import { deepEqual } from "@wagmi/core"

export function createComponentSystem(componentKey: string) {
  // console.log('createComponentSystem', componentKey);
  // console.log('xxx', (get(publicNetwork).components as any)[componentKey]);
  (get(publicNetwork).components as any)[componentKey].update$.subscribe(
    (update: ComponentUpdate) => {
      // console.log('___________ comp. update', update)

      const [nextValue, prevValue] = update.value

      // If the values are the same we assume
      // this is directly after hydration
      // Abort
      if (deepEqual(nextValue, prevValue)) return

      const entityID = update.entity as string
      const propertyName = toCamelCase(componentKey)

      // Single-value components have a "value" property, structs do not
      const newValue =
        nextValue && Object.prototype.hasOwnProperty.call(nextValue, "value")
          ? nextValue.value
          : nextValue


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
