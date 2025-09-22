/**
 * Page state transition utilities for room results
 * Extracted from the original state.svelte.ts to work with page state
 */

import type { EnterRoomReturnValue } from "@server/modules/types"
import { TRIP_STATE } from "$lib/components/Room/Trip/state.svelte"

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

/**
 * Determines which result summary state to transition to based on the room result
 */
export const determineResultSummaryState = (result: EnterRoomReturnValue): TRIP_STATE => {
  if (result?.ratDead) {
    return TRIP_STATE.SUMMARY_RAT_DEAD
  }
  return TRIP_STATE.SUMMARY
}

/**
 * Creates state transition functions that work with page state
 */
export const createTripTransitions = (entryState: App.PageState["entryState"]) => {
  const transitionTo = (newState: TRIP_STATE) => {
    const currentState = entryState.state
    const validTransitions = VALID_TRANSITIONS[currentState]
    if (!validTransitions.includes(newState)) {
      console.error(`Invalid state transition from ${currentState} to ${newState}`)
      entryState.state = TRIP_STATE.ERROR
      entryState.error = true
      entryState.errorMessage = `Invalid state transition from ${currentState} to ${newState}`
      return
    }
    entryState.state = newState
  }

  const transitionToResultSummary = (result?: EnterRoomReturnValue) => {
    if (result) {
      transitionTo(determineResultSummaryState(result))
    } else {
      transitionTo(TRIP_STATE.SUMMARY)
    }
  }

  return {
    transitionTo,
    transitionToResultSummary
  }
}
