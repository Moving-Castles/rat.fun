/**
 * ========================================
 *  Trip/state.svelte.ts
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
import type { FrozenRat, FrozenRoom, OutcomeDataStringMap } from "./types"
import type { EnterRoomReturnValue } from "@server/modules/types"
import type { Hex } from "viem"
import { addressToRatImage } from "$lib/modules/utils"
import { errorHandler, InvalidStateTransitionError } from "$lib/modules/error-handling"

/*
 * ─────────────────────────────────────────────
 * Room Result Flow State
 * ─────────────────────────────────────────────
 * The room result flow is modeled as a state machine.
 */

/**
 * The flow is:
 * 1. Wait for result / Trip setup ± 5s
 * 2. Wait for result / Trip visualizer ± 5-10s depending on outcome
 * 3. Show results
 * 4. Show result summary depending on outcome
 */
export enum TRIP_STATE {
  SETUP = "SETUP",
  PROCESSING = "PROCESSING",
  RESULTS = "RESULTS",
  SUMMARY = "SUMMARY",
  SUMMARY_RAT_DEAD = "SUMMARY_RAT_DEAD",
  ERROR = "ERROR"
}

/** Current state of the room result flow */
export const roomResultState: { state: TRIP_STATE; errorMessage: string | null } = $state({
  state: TRIP_STATE.SETUP,
  errorMessage: null
})

/**
 * Defines valid state transitions between room result states
 * Maps each state to an array of valid states it can transition to
 */
const VALID_TRANSITIONS: Record<TRIP_STATE, TRIP_STATE[]> = {
  [TRIP_STATE.SETUP]: [TRIP_STATE.PROCESSING, TRIP_STATE.ERROR],
  [TRIP_STATE.PROCESSING]: [TRIP_STATE.RESULTS, TRIP_STATE.ERROR],
  [TRIP_STATE.RESULTS]: [TRIP_STATE.SUMMARY, TRIP_STATE.SUMMARY_RAT_DEAD, TRIP_STATE.ERROR],
  [TRIP_STATE.SUMMARY]: [TRIP_STATE.ERROR],
  [TRIP_STATE.SUMMARY_RAT_DEAD]: [TRIP_STATE.ERROR],
  [TRIP_STATE.ERROR]: []
}

/** States where info boxes should be shown (all except splash screen and error) */
export const SHOW_INFO_BOXES = [TRIP_STATE.RESULTS, TRIP_STATE.SUMMARY, TRIP_STATE.SUMMARY_RAT_DEAD]

/** States where the log should be shown */
export const SHOW_LOG = [TRIP_STATE.RESULTS, TRIP_STATE.SUMMARY, TRIP_STATE.SUMMARY_RAT_DEAD]

/**
 * Transitions to the appropriate result summary state based on the room result
 * @param result The result returned from entering a room
 */
export const transitionToResultSummary = (result?: EnterRoomReturnValue) => {
  if (result) {
    transitionTo(determineResultSummaryState(result))
  } else {
    transitionTo(TRIP_STATE.SUMMARY)
  }
}

/**
 * Transitions to a new state if the transition is valid
 * @param newState The state to transition to
 */
export const transitionTo = (newState: TRIP_STATE) => {
  const validTransitions = VALID_TRANSITIONS[roomResultState.state]
  if (!validTransitions.includes(newState)) {
    errorHandler(
      new InvalidStateTransitionError(
        "INVALID_STATE_TRANSITION_ERROR",
        "State management error",
        `Invalid state transition from ${roomResultState.state} to ${newState}`
      )
    )
    return
  }
  roomResultState.state = newState
}

/**
 * Determines which result summary state to transition to based on the room result
 * @param result The result returned from entering a room
 * @returns The appropriate result summary state
 */
const determineResultSummaryState = (result: EnterRoomReturnValue): TRIP_STATE => {
  if (result?.ratDead) {
    return TRIP_STATE.SUMMARY_RAT_DEAD
  }
  return TRIP_STATE.SUMMARY
}

/** Resets the room result state back to the initial splash screen */
export const resetTripState = () => {
  roomResultState.state = TRIP_STATE.SETUP
  roomResultState.errorMessage = null
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
export const frozenRoom = writable<Partial<FrozenRoom> | null>(null)
/** Rat information frozen before entering a room */
export const frozenRat = writable<Partial<FrozenRat> | null>(null)

/**
 * Freezes the rat and room objects before entering a room
 * @param rat The rat object
 * @param room The room object
 * @param roomId The room ID
 */
export function freezeObjects(rat: Rat, room: Room, roomId: Hex, ratId: Hex) {
  const preppedRat = structuredClone(rat) as FrozenRat
  if (!preppedRat.inventory) preppedRat.inventory = []
  preppedRat.image = addressToRatImage(ratId)
  frozenRat.set(preppedRat)

  const preppedRoom = structuredClone(room) as FrozenRoom
  preppedRoom.id = roomId
  frozenRoom.set(preppedRoom)

  return {
    frozenRat: preppedRat,
    frozenRoom: preppedRoom
  }
}

// ======= Route updates to frozen state =======

/**
 * Updates the frozen state of the rat and room based on the outcome
 * @param dataset The dataset of the outcome
 */
export const updateFrozenState = (dataset: OutcomeDataStringMap) => {
  const { type, action, value, name, id } = dataset

  if (!type || !action || value === undefined) {
    return
  }

  const numericValue = Number(value)

  switch (type) {
    case "balance":
      changeBalance(numericValue)
      break
    case "item":
      if (action === "add") {
        addItem(name ?? "", numericValue)
      } else if (action === "remove") {
        removeItem(id ?? "", numericValue)
      }
      break
  }
}

// ======= Balance =======

/**
 * Changes the balance of the rat and change the room balance by the inverse amount
 * @param balanceChange The amount to change the balance by
 */
function changeBalance(balanceChange: number) {
  frozenRat.update(rat => {
    if (!rat) return null
    rat.balance = BigInt(rat?.balance || 0) + BigInt(balanceChange)
    return rat
  })

  // Inverse rat balance change to get room balance change
  frozenRoom.update(room => {
    if (!room) return null
    room.balance = BigInt(room?.balance || 0) - BigInt(balanceChange)
    return room
  })
}

// ======= Inventory =======

/**
 * Adds an item to the rat and reduce the room balance by the item value
 * @param itemName The name of the item
 * @param itemValue The value of the item
 */
function addItem(itemName: string, itemValue: number) {
  frozenRat.update(rat => {
    if (!rat) return null
    if (!rat.inventory) rat.inventory = []
    const newTempItem = {
      name: itemName,
      value: itemValue
    }
    rat.inventory.push(newTempItem)
    return rat
  })

  // Change room balance
  // Items always have positive value
  frozenRoom.update(room => {
    if (!room) return null
    room.balance = BigInt(room?.balance || 0) - BigInt(itemValue)
    return room
  })
}

/**
 * Removes an item from the rat and increase the room balance by the item value
 * @param id The ID of the item
 * @param itemValue The value of the item
 */
function removeItem(id: string, itemValue: number) {
  frozenRat.update(rat => {
    if (!rat) return null
    rat.inventory = rat?.inventory?.filter(i => i !== id)
    return rat
  })

  // Change room balance
  // Items always have positive value
  frozenRoom.update(room => {
    if (!room) return null
    room.balance = BigInt(room?.balance || 0) + BigInt(itemValue)
    return room
  })
}
