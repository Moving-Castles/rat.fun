import { writable } from "svelte/store"
import type { FrozenRat, FrozenRoom } from "./types"
import type { Hex } from "viem"
export const frozenRoom = writable<FrozenRoom | null>(null)
export const frozenRat = writable<FrozenRat | null>(null)

export function freezeObjects(rat: Rat, room: Room, roomId: Hex) {
  const preppedRat = structuredClone(rat) as FrozenRat
  if (!preppedRat.inventory) preppedRat.inventory = []
  if (!preppedRat.traits) preppedRat.traits = []

  frozenRat.set(preppedRat)

  const preppedRoom = structuredClone(room) as FrozenRoom
  preppedRoom.id = roomId
  frozenRoom.set(preppedRoom)
}

// ------------------------------------------------------------
// Health
// ------------------------------------------------------------

export function changeHealth(healthChange: number) {
  frozenRat.update(rat => {
    if (!rat) return null
    rat.health = rat.health + BigInt(healthChange)
    return rat
  })

  // Inverse rat health change to get room balance change
  frozenRoom.update(room => {
    if (!room) return null
    room.balance = room.balance - BigInt(healthChange)
    return room
  })
}

// ------------------------------------------------------------
// Balance
// ------------------------------------------------------------

export function changeBalance(balanceChange: number) {
  frozenRat.update(rat => {
    if (!rat) return null
    rat.balance = rat.balance + BigInt(balanceChange)
    return rat
  })

  // Inverse rat balance change to get room balance change
  frozenRoom.update(room => {
    if (!room) return null
    room.balance = room.balance - BigInt(balanceChange)
    return room
  })
}

// ------------------------------------------------------------
// Inventory
// ------------------------------------------------------------

export function addItem(itemName: string, itemValue: number) {
  frozenRat.update(rat => {
    if (!rat) return null
    if (!rat.inventory) rat.inventory = []
    const newTempItem = {
      name: itemName,
      value: itemValue,
    }
    rat.inventory.push(newTempItem)
    return rat
  })

  // Change room balance
  // Items always have positive value
  frozenRoom.update(room => {
    if (!room) return null
    room.balance = room.balance - BigInt(itemValue)
    return room
  })
}

export function removeItem(id: string, itemValue: number) {
  frozenRat.update(rat => {
    if (!rat) return null
    rat.inventory = rat.inventory.filter(i => i !== id)
    return rat
  })

  // Change room balance
  // Items always have positive value
  frozenRoom.update(room => {
    if (!room) return null
    room.balance = room.balance + BigInt(itemValue)
    return room
  })
}

// ------------------------------------------------------------
// Traits
// ------------------------------------------------------------

export function addTrait(traitName: string, traitValue: number) {
  frozenRat.update(rat => {
    if (!rat) return null
    const newTempItem = {
      name: traitName,
      value: traitValue,
    }
    rat.traits.push(newTempItem)
    return rat
  })

  // Change room balance
  frozenRoom.update(room => {
    if (!room) return null
    room.balance = room.balance - BigInt(traitValue)
    return room
  })
}

export function removeTrait(id: string, traitValue: number) {
  frozenRat.update(rat => {
    if (!rat) return null
    rat.traits = rat.traits.filter(t => t !== id)
    return rat
  })

  // Change room balance
  frozenRoom.update(room => {
    if (!room) return null
    room.balance = room.balance + BigInt(traitValue)
    return room
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
  const { type, action, value, name, id } = dataset

  if (!type || !action || value === undefined) return

  const numericValue = Number(value)

  switch (type) {
    case "health":
    case "balance":
      stateUpdateFunctions[type]?.(numericValue)
      break
    case "item":
      if (action === "add") {
        stateUpdateFunctions.item["add"]?.(name ?? "", numericValue)
      } else if (action === "remove") {
        stateUpdateFunctions.item["remove"]?.(id ?? "", numericValue)
      }
      break
    case "trait":
      if (action === "add") {
        stateUpdateFunctions.trait["add"]?.(name ?? "", numericValue)
      } else if (action === "remove") {
        stateUpdateFunctions.trait["remove"]?.(id ?? "", numericValue)
      }
      break
  }
}
