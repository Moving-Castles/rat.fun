// Human // Event // Readability // Protocol

// type HerpEvent = {
//   name: string
//   description: string
//   condition: store | $state | $derived
//   callback: () => void
// }

import * as stores from "@modules/state/base/stores"
import { blockNumber } from "@modules/network"

// const deathEvent = {
//   name: "DEATH",
//   description: "Your rat dies",
//   state: () => {
//     const conditionFn = $derived.by(() => {
//       stores.rat.subscribe(val => {
//         if (Number(val.health ?? 0) === 0) return true

//         return false
//       })
//     })
//     const callbackFn = async () => {
//       console.log("YOU ARE DEAD")
//     }
//     return {
//       get condition() {
//         return conditionFn
//       },
//       get callback() {
//         return callbackFn
//       },
//     }
//   },
// }

const deathEvent = {
  name: "BLOCK_TICK",
  description: "Block's ticking",
  logic: () => {
    let conditionState = $state(true)

    stores.rat.subscribe(val => {
      if (Number(val?.health ?? 0) === 0) conditionState = true
    })

    return {
      get condition() {
        return conditionState
      },
      get callback() {
        return async () => {
          console.log("YOU ARE DEAD")
        }
      },
    }
  },
}

export const events = $state([deathEvent])
