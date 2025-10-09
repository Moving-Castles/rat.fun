/**
 * ========================================
 *  Trip/state.svelte.ts
 * ========================================
 * This module keeps track of the state of the trip result flow.
 * There are two main parts:
 *
 * 1. Trip result flow state
 * - Stores current state
 * - Handles state transitions
 *
 * 2. The frozen rat and trip
 * - Freeze the state of the rat and trip
 * - Updates frozen state based on outcome
 * - Handles DOM interactions
 */

import { writable } from "svelte/store"
import type { FrozenRat, FrozenTrip, OutcomeDataStringMap } from "./types"
import type { Hex } from "viem"
import { addressToRatImage } from "$lib/modules/utils"
import { errorHandler, InvalidStateTransitionError } from "$lib/modules/error-handling"

/*
 * ─────────────────────────────────────────────
 * Trip Result Flow State
 * ─────────────────────────────────────────────
 * The trip result flow is modeled as a state machine.
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
  ERROR = "ERROR"
}

/** Current state of the trip result flow */
export const tripResultState: { state: TRIP_STATE; errorMessage: string | null } = $state({
  state: TRIP_STATE.SETUP,
  errorMessage: null
})

/**
 * Defines valid state transitions between trip result states
 * Maps each state to an array of valid states it can transition to
 */
const VALID_TRANSITIONS: Record<TRIP_STATE, TRIP_STATE[]> = {
  [TRIP_STATE.SETUP]: [TRIP_STATE.PROCESSING, TRIP_STATE.ERROR],
  [TRIP_STATE.PROCESSING]: [TRIP_STATE.RESULTS, TRIP_STATE.ERROR],
  [TRIP_STATE.RESULTS]: [TRIP_STATE.ERROR],
  [TRIP_STATE.ERROR]: []
}

/**
 * Transitions to a new state if the transition is valid
 * @param newState The state to transition to
 */
export const transitionTo = (newState: TRIP_STATE) => {
  const validTransitions = VALID_TRANSITIONS[tripResultState.state]
  if (!validTransitions.includes(newState)) {
    errorHandler(
      new InvalidStateTransitionError(
        "INVALID_STATE_TRANSITION_ERROR",
        "State management error",
        `Invalid state transition from ${tripResultState.state} to ${newState}`
      )
    )
    return
  }
  tripResultState.state = newState
}

/** Resets the trip result state back to the initial splash screen */
export const resetTripState = () => {
  tripResultState.state = TRIP_STATE.SETUP
  tripResultState.errorMessage = null
}

/*
 * ─────────────────────────────────────────────
 * Frozen Rat and Trip
 * ─────────────────────────────────────────────
 * We freeze the rat and trip objects before entering a trip
 * to be able to gradually update their values without reactivity
 * from on-chain changes.
 */

/** Trip information frozen before entering a trip */
export const frozenTrip = writable<Partial<FrozenTrip> | null>(null)
/** Rat information frozen before entering a trip */
export const frozenRat = writable<Partial<FrozenRat> | null>(null)

/**
 * Freezes the rat and trip objects before entering a trip
 * @param rat The rat object
 * @param trip The trip object
 * @param tripId The trip ID
 */
export function freezeObjects(rat: Rat, trip: Trip, tripId: Hex, ratId: Hex) {
  const preppedRat = structuredClone(rat) as FrozenRat
  if (!preppedRat.inventory) preppedRat.inventory = []
  preppedRat.image = addressToRatImage(ratId)
  frozenRat.set(preppedRat)

  const preppedTrip = structuredClone(trip) as FrozenTrip
  preppedTrip.id = tripId
  frozenTrip.set(preppedTrip)

  return {
    frozenRat: preppedRat,
    frozenTrip: preppedTrip
  }
}

// ======= Route updates to frozen state =======

/**
 * Updates the frozen state of the rat and trip based on the outcome
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
 * Changes the balance of the rat and change the trip balance by the inverse amount
 * @param balanceChange The amount to change the balance by
 */
function changeBalance(balanceChange: number) {
  frozenRat.update(rat => {
    if (!rat) return null
    rat.balance = BigInt(rat?.balance || 0) + BigInt(balanceChange)
    return rat
  })

  // Inverse rat balance change to get trip balance change
  frozenTrip.update(trip => {
    if (!trip) return null
    trip.balance = BigInt(trip?.balance || 0) - BigInt(balanceChange)
    return trip
  })
}

// ======= Inventory =======

/**
 * Adds an item to the rat and reduce the trip balance by the item value
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

  // Change trip balance
  // Items always have positive value
  frozenTrip.update(trip => {
    if (!trip) return null
    trip.balance = BigInt(trip?.balance || 0) - BigInt(itemValue)
    return trip
  })
}

/**
 * Removes an item from the rat and increase the trip balance by the item value
 * @param id The ID of the item
 * @param itemValue The value of the item
 */
function removeItem(id: string, itemValue: number) {
  frozenRat.update(rat => {
    if (!rat) return null
    rat.inventory = rat?.inventory?.filter(i => i !== id)
    return rat
  })

  // Change trip balance
  // Items always have positive value
  frozenTrip.update(trip => {
    if (!trip) return null
    trip.balance = BigInt(trip?.balance || 0) + BigInt(itemValue)
    return trip
  })
}
