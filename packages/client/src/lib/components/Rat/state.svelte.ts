import { errorHandler } from "$lib/modules/error-handling"
import { InvalidStateTransitionError } from "$lib/modules/error-handling/errors"

/**
 * ========================================
 *  Rat/state.svelte.ts
 * ========================================
 * This module keeps track of the state of the rat box flow.
 * There are two main parts:
 *
 * 1. Rat box flow state
 * - Stores current state
 * - Handles state transitions
 *
 */

/*
 * ─────────────────────────────────────────────
 * Rat Box Flow State
 * ─────────────────────────────────────────────
 * The rat box flow is modeled as a state machine.
 */

export enum RAT_BOX_STATE {
  INIT = "INIT",
  NO_TOKENS = "NO_TOKENS",
  NO_ALLOWANCE = "NO_ALLOWANCE",
  NO_RAT = "NO_RAT",
  DEPLOYING_RAT = "DEPLOYING_RAT",
  HAS_RAT = "HAS_RAT",
  CONFIRM_LIQUIDATION = "CONFIRM_LIQUIDATION",
  LIQUIDATING_RAT = "LIQUIDATING_RAT",
  PAST_TRIP_LIST = "PAST_TRIP_LIST",
  PAST_TRIP_ENTRY = "PAST_TRIP_ENTRY",
  ERROR = "ERROR"
}

// Local state
let ratBoxState = $state<RAT_BOX_STATE>(RAT_BOX_STATE.INIT)

/**
 * Defines valid state transitions between rat box states
 * Maps each state to an array of valid states it can transition to
 */
const VALID_TRANSITIONS: Record<RAT_BOX_STATE, RAT_BOX_STATE[]> = {
  [RAT_BOX_STATE.INIT]: [
    RAT_BOX_STATE.NO_TOKENS,
    RAT_BOX_STATE.NO_ALLOWANCE,
    RAT_BOX_STATE.NO_RAT,
    RAT_BOX_STATE.HAS_RAT,
    RAT_BOX_STATE.ERROR
  ],
  [RAT_BOX_STATE.NO_TOKENS]: [
    RAT_BOX_STATE.NO_ALLOWANCE,
    RAT_BOX_STATE.NO_RAT,
    RAT_BOX_STATE.ERROR
  ],
  [RAT_BOX_STATE.NO_ALLOWANCE]: [RAT_BOX_STATE.NO_RAT, RAT_BOX_STATE.ERROR],
  [RAT_BOX_STATE.NO_RAT]: [RAT_BOX_STATE.DEPLOYING_RAT, RAT_BOX_STATE.ERROR],
  [RAT_BOX_STATE.DEPLOYING_RAT]: [RAT_BOX_STATE.HAS_RAT, RAT_BOX_STATE.ERROR],
  [RAT_BOX_STATE.HAS_RAT]: [
    RAT_BOX_STATE.NO_RAT,
    RAT_BOX_STATE.CONFIRM_LIQUIDATION,
    RAT_BOX_STATE.PAST_TRIP_LIST,
    RAT_BOX_STATE.ERROR
  ],
  [RAT_BOX_STATE.PAST_TRIP_LIST]: [
    RAT_BOX_STATE.PAST_TRIP_ENTRY,
    RAT_BOX_STATE.HAS_RAT,
    RAT_BOX_STATE.ERROR
  ],
  [RAT_BOX_STATE.PAST_TRIP_ENTRY]: [RAT_BOX_STATE.PAST_TRIP_LIST, RAT_BOX_STATE.ERROR],
  [RAT_BOX_STATE.CONFIRM_LIQUIDATION]: [
    RAT_BOX_STATE.HAS_RAT,
    RAT_BOX_STATE.LIQUIDATING_RAT,
    RAT_BOX_STATE.ERROR
  ],
  [RAT_BOX_STATE.LIQUIDATING_RAT]: [RAT_BOX_STATE.NO_RAT, RAT_BOX_STATE.ERROR],
  [RAT_BOX_STATE.ERROR]: []
}

const setRatBoxState = (state: RAT_BOX_STATE) => {
  ratBoxState = state
}

const transitionTo = (newState: RAT_BOX_STATE) => {
  if (newState === ratBoxState) return
  const validTransitions = VALID_TRANSITIONS[ratBoxState]
  if (!validTransitions.includes(newState)) {
    const err = new InvalidStateTransitionError(
      undefined,
      undefined,
      `Invalid state transition from ${ratBoxState} to ${newState}`
    )
    errorHandler(err)
    return
  }
  setRatBoxState(newState)
}

// Export singleton instance instead of factory function
export const ratState = {
  state: {
    set: setRatBoxState,
    transitionTo,
    get current() {
      return ratBoxState
    }
  }
}
