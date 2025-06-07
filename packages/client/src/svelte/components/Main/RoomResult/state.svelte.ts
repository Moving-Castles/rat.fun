/**
 * ========================================
 *  RoomResult/state.svelte.ts
 * ========================================
 * This module keeps track of the state of the room result flow.
 * There are two main parts:
 * 
 * 1. Room result flow state
 * - Stores current state
 * - Handles state transitions
 * 
 * 2. The frozen rat and room
 * - Freeze the state of the rat and room
 * - Updates frozen state based on outcome
 * - Handles DOM interactions
 */

import { writable } from "svelte/store"
import type { FrozenRat, FrozenRoom } from "./types"
import type { EnterRoomReturnValue } from "@server/modules/types"
import type { Hex } from "viem"


/*
 * ─────────────────────────────────────────────
 * Room Result Flow State
 * ─────────────────────────────────────────────
 * The room result flow is modeled as a state machine.
 */

/**
 * The flow is:
 * 1. Show splash screen
 * 2. Wait for result
 * 3. Show results
 * 4. Show result summary depending on outcome
 */
export enum ROOM_RESULT_STATE {
  SPLASH_SCREEN = "SPLASH_SCREEN",
  WAITING_FOR_RESULT = "WAITING_FOR_RESULT",
  SHOWING_RESULTS = "SHOWING_RESULTS",
  RESULT_SUMMARY_NORMAL = "RESULT_SUMMARY_NORMAL",
  RESULT_SUMMARY_RAT_DEAD = "RESULT_SUMMARY_RAT_DEAD",
  RESULT_SUMMARY_LEVEL_UP = "RESULT_SUMMARY_LEVEL_UP",
  RESULT_SUMMARY_LEVEL_DOWN = "RESULT_SUMMARY_LEVEL_DOWN",
  ERROR = "ERROR"
}

/** Current state of the room result flow */
export let roomResultState: {state: ROOM_RESULT_STATE, errorMessage: string | null} = $state({
  state: ROOM_RESULT_STATE.SPLASH_SCREEN,
  errorMessage: null
})

/** 
 * Defines valid state transitions between room result states
 * Maps each state to an array of valid states it can transition to
 */
const VALID_TRANSITIONS: Record<ROOM_RESULT_STATE, ROOM_RESULT_STATE[]> = {
  [ROOM_RESULT_STATE.SPLASH_SCREEN]: [ROOM_RESULT_STATE.WAITING_FOR_RESULT, ROOM_RESULT_STATE.ERROR],
  [ROOM_RESULT_STATE.WAITING_FOR_RESULT]: [ROOM_RESULT_STATE.SHOWING_RESULTS, ROOM_RESULT_STATE.ERROR],
  [ROOM_RESULT_STATE.SHOWING_RESULTS]: [
    ROOM_RESULT_STATE.RESULT_SUMMARY_NORMAL,
    ROOM_RESULT_STATE.RESULT_SUMMARY_RAT_DEAD,
    ROOM_RESULT_STATE.RESULT_SUMMARY_LEVEL_UP,
    ROOM_RESULT_STATE.RESULT_SUMMARY_LEVEL_DOWN,
    ROOM_RESULT_STATE.ERROR
  ],
  [ROOM_RESULT_STATE.RESULT_SUMMARY_NORMAL]: [ROOM_RESULT_STATE.ERROR],
  [ROOM_RESULT_STATE.RESULT_SUMMARY_RAT_DEAD]: [ROOM_RESULT_STATE.ERROR],
  [ROOM_RESULT_STATE.RESULT_SUMMARY_LEVEL_UP]: [ROOM_RESULT_STATE.ERROR],
  [ROOM_RESULT_STATE.RESULT_SUMMARY_LEVEL_DOWN]: [ROOM_RESULT_STATE.ERROR],
  [ROOM_RESULT_STATE.ERROR]: []
}

/** States where info boxes should be shown (all except splash screen and error) */
export const SHOW_INFO_BOXES = [
  ROOM_RESULT_STATE.WAITING_FOR_RESULT,
  ROOM_RESULT_STATE.SHOWING_RESULTS,
  ROOM_RESULT_STATE.RESULT_SUMMARY_NORMAL,
  ROOM_RESULT_STATE.RESULT_SUMMARY_RAT_DEAD,
  ROOM_RESULT_STATE.RESULT_SUMMARY_LEVEL_UP,
  ROOM_RESULT_STATE.RESULT_SUMMARY_LEVEL_DOWN,
]

/** States where the log should be shown */
export const SHOW_LOG = [
  ROOM_RESULT_STATE.SHOWING_RESULTS,
  ROOM_RESULT_STATE.RESULT_SUMMARY_NORMAL,
  ROOM_RESULT_STATE.RESULT_SUMMARY_RAT_DEAD,
  ROOM_RESULT_STATE.RESULT_SUMMARY_LEVEL_UP,
  ROOM_RESULT_STATE.RESULT_SUMMARY_LEVEL_DOWN
]

/** 
 * Transitions to the appropriate result summary state based on the room result
 * @param result The result returned from entering a room
 */
export const transitionToResultSummary = (result: EnterRoomReturnValue) => {
  transitionTo(determineResultSummaryState(result))
}

/**
 * Transitions to a new state if the transition is valid
 * @param newState The state to transition to
 */
export const transitionTo = (newState: ROOM_RESULT_STATE) => {
  const validTransitions = VALID_TRANSITIONS[roomResultState.state]
  if (!validTransitions.includes(newState)) {
    console.error(`Invalid state transition from ${roomResultState} to ${newState}`)
    return
  }
  roomResultState.state = newState
}

/** Resets the room result state back to the initial splash screen */
export const resetRoomResultState = () => {
  roomResultState.state = ROOM_RESULT_STATE.SPLASH_SCREEN
  roomResultState.errorMessage = null
}

/**
 * Determines which result summary state to transition to based on the room result
 * @param result The result returned from entering a room
 * @returns The appropriate result summary state
 */
const determineResultSummaryState = (result: EnterRoomReturnValue): ROOM_RESULT_STATE => {
  if (result?.ratDead) {
    return ROOM_RESULT_STATE.RESULT_SUMMARY_RAT_DEAD
  } else if (result?.levelUp) {
    return ROOM_RESULT_STATE.RESULT_SUMMARY_LEVEL_UP
  } else if (result?.levelDown) {
    return ROOM_RESULT_STATE.RESULT_SUMMARY_LEVEL_DOWN
  }
  return ROOM_RESULT_STATE.RESULT_SUMMARY_NORMAL
}


/*
 * ─────────────────────────────────────────────
 * Frozen Rat and Room
 * ─────────────────────────────────────────────
 * We freeze the rat and room objects before entering a room
 * to be able to gradually update their values without reactivity
 * from on-chain changes.
 */

/** Room information frozen before entering a room */
export const frozenRoom = writable<FrozenRoom | null>(null)
/** Rat information frozen before entering a room */
export const frozenRat = writable<FrozenRat | null>(null)

/**
 * Freezes the rat and room objects before entering a room
 * @param rat The rat object
 * @param room The room object
 * @param roomId The room ID
 */
export function freezeObjects(rat: Rat, room: Room, roomId: Hex) {
  const preppedRat = structuredClone(rat) as FrozenRat
  if (!preppedRat.inventory) preppedRat.inventory = []
  if (!preppedRat.traits) preppedRat.traits = []
  frozenRat.set(preppedRat)

  const preppedRoom = structuredClone(room) as FrozenRoom
  preppedRoom.id = roomId
  frozenRoom.set(preppedRoom)
}

// ======= Health =======

/**
 * Changes the health of the rat and change the room balance by the inverse amount
 * @param healthChange The amount to change the health by
 */
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

// ======= Balance =======

/**
 * Changes the balance of the rat and change the room balance by the inverse amount
 * @param balanceChange The amount to change the balance by
 */
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

// ======= Inventory =======

/**
 * Adds an item to the rat and reduce the room balance by the item value
 * @param itemName The name of the item
 * @param itemValue The value of the item
 */
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

/**
 * Removes an item from the rat and increase the room balance by the item value
 * @param id The ID of the item
 * @param itemValue The value of the item
 */
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

// ======= Traits =======

/**
 * Adds a trait to the rat and reduce the room balance by the trait value
 * @param traitName The name of the trait
 * @param traitValue The value of the trait
 */
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

/**
 * Removes a trait from the rat and increase the room balance by the trait value
 * @param id The ID of the trait
 * @param traitValue The value of the trait
 */
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

// ======= Summary =======

const frozenStateUpdateFunctions = {
  health: changeHealth,
  balance: changeBalance,
  item: { add: addItem, remove: removeItem },
  trait: { add: addTrait, remove: removeTrait },
}

// ======= DOM Interactions =======

/**
 * Updates the frozen state of the rat and room based on the outcome
 * @param dataset The dataset of the outcome
 */
export const updateFrozenState = (dataset: DOMStringMap) => {
  const { type, action, value, name, id } = dataset

  if (!type || !action || value === undefined) return

  const numericValue = Number(value)

  switch (type) {
    case "health":
    case "balance":
      frozenStateUpdateFunctions[type]?.(numericValue)
      break
    case "item":
      if (action === "add") {
        frozenStateUpdateFunctions.item["add"]?.(name ?? "", numericValue)
      } else if (action === "remove") {
        frozenStateUpdateFunctions.item["remove"]?.(id ?? "", numericValue)
      }
      break
    case "trait":
      if (action === "add") {
        frozenStateUpdateFunctions.trait["add"]?.(name ?? "", numericValue)
      } else if (action === "remove") {
        frozenStateUpdateFunctions.trait["remove"]?.(id ?? "", numericValue)
      }
      break
  }
}
