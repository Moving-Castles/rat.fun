import { writable } from "svelte/store"

export const frozenRoom = writable<Room | null>(null)
export const frozenRat = writable<Rat | null>(null)

export function freezeObjects(rat: Rat, room: Room) {
  const preppedRat = structuredClone(rat)
  if (!preppedRat.inventory) preppedRat.inventory = []
  if (!preppedRat.traits) preppedRat.traits = []

  frozenRat.set(preppedRat)
  frozenRoom.set(structuredClone(room))
}

// ------------------------------------------------------------
// Health
// ------------------------------------------------------------

export function changeHealth(healthChange: number) {
  frozenRat.update(rat => {
    if (!rat) return null
    rat.health = Number(rat.health) + healthChange
    return rat
  })

  // Inverse rat health change to get room balance change
  frozenRoom.update(room => {
    if (!room) return null
    room.balance = Number(room.balance) - healthChange
    return room
  })
}

// ------------------------------------------------------------
// Balance
// ------------------------------------------------------------

export function changeBalance(balanceChange: number) {
  frozenRat.update(rat => {
    if (!rat) return null
    rat.balance = Number(rat.balance) + balanceChange
    return rat
  })

  // Inverse rat balance change to get room balance change
  frozenRoom.update(room => {
    if (!room) return null
    room.balance = Number(room.balance) - balanceChange
    return room
  })
}

// ------------------------------------------------------------
// Inventory
// ------------------------------------------------------------

export function addItem(itemId: string, itemValue: number) {
  frozenRat.update(rat => {
    if (!rat) return null
    if (!rat.inventory) rat.inventory = []
    rat.inventory.push(itemId)
    return rat
  })

  // Items always have positive value
  frozenRoom.update(room => {
    if (!room) return null
    room.balance = Number(room.balance) - itemValue
    return room
  })
}

export function removeItem(itemId: string, itemValue: number) {
  frozenRat.update(rat => {
    if (!rat) return null
    rat.inventory = rat.inventory.filter(i => i !== itemId)
    return rat
  })

  // Items always have positive value
  frozenRoom.update(room => {
    if (!room) return null
    room.balance = Number(room.balance) + itemValue
    return room
  })
}

// ------------------------------------------------------------
// Traits
// ------------------------------------------------------------

export function addTrait(traitId: string) {
  frozenRat.update(rat => {
    if (!rat) return null
    rat.traits.push(traitId)
    return rat
  })
}

export function removeTrait(traitId: string) {
  frozenRat.update(rat => {
    if (!rat) return null
    rat.traits = rat.traits.filter(t => t !== traitId)
    return rat
  })
}

// ------------------------------------------------------------
// Summary
// ------------------------------------------------------------
export const stateUpdateFunctions = {
  health: changeHealth,
  balance: changeBalance,
  item: { add: addItem, remove: removeItem },
  trait: { add: addTrait, remove: removeTrait },
}

// ------------------------------------------------------------
// DOM Interactions
// ------------------------------------------------------------
export const updateState = (dataset: DOMStringMap) => {
  const { type, action, value, itemId, traitId } = dataset

  if (!type || !action || value === undefined) return

  const numericValue = Number(value)

  switch (type) {
    case "health":
    case "balance":
      stateUpdateFunctions[type]?.(numericValue)
      break
    case "item":
      console.log("item", action)
      if (action === "add" || action === "remove") {
        console.log("item", action, stateUpdateFunctions.item[action])
        stateUpdateFunctions.item[action]?.(itemId ?? "", numericValue)
      }
      break
    case "trait":
      if (action === "add" || action === "remove") {
        // Pass the value from the dataset if it's relevant for traits
        // Otherwise, keep using 1 if it's just add/remove presence
        stateUpdateFunctions.trait[action]?.(traitId ?? "", numericValue)
      }
      break
  }
}
