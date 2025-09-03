/**
 * Page state transition utilities for room results
 * Extracted from the original state.svelte.ts to work with page state
 */

import type { EnterRoomReturnValue } from "@server/modules/types"
import { ROOM_RESULT_STATE } from "$lib/components/Room/RoomResult/state.svelte"

/**
 * Defines valid state transitions between room result states
 * Maps each state to an array of valid states it can transition to
 */
const VALID_TRANSITIONS: Record<ROOM_RESULT_STATE, ROOM_RESULT_STATE[]> = {
  [ROOM_RESULT_STATE.SPLASH_SCREEN]: [
    ROOM_RESULT_STATE.WAITING_FOR_RESULT,
    ROOM_RESULT_STATE.ERROR
  ],
  [ROOM_RESULT_STATE.WAITING_FOR_RESULT]: [
    ROOM_RESULT_STATE.SHOWING_RESULTS,
    ROOM_RESULT_STATE.ERROR
  ],
  [ROOM_RESULT_STATE.SHOWING_RESULTS]: [
    ROOM_RESULT_STATE.RESULT_SUMMARY_NORMAL,
    ROOM_RESULT_STATE.RESULT_SUMMARY_RAT_DEAD,
    ROOM_RESULT_STATE.ERROR
  ],
  [ROOM_RESULT_STATE.RESULT_SUMMARY_NORMAL]: [ROOM_RESULT_STATE.ERROR],
  [ROOM_RESULT_STATE.RESULT_SUMMARY_RAT_DEAD]: [ROOM_RESULT_STATE.ERROR],
  [ROOM_RESULT_STATE.ERROR]: []
}

/**
 * Determines which result summary state to transition to based on the room result
 */
export const determineResultSummaryState = (result: EnterRoomReturnValue): ROOM_RESULT_STATE => {
  if (result?.ratDead) {
    return ROOM_RESULT_STATE.RESULT_SUMMARY_RAT_DEAD
  }
  return ROOM_RESULT_STATE.RESULT_SUMMARY_NORMAL
}

/**
 * Creates state transition functions that work with page state
 */
export const createRoomResultTransitions = (entryState: App.PageState["entryState"]) => {
  const transitionTo = (newState: ROOM_RESULT_STATE) => {
    const currentState = entryState.state
    const validTransitions = VALID_TRANSITIONS[currentState]
    if (!validTransitions.includes(newState)) {
      console.error(`Invalid state transition from ${currentState} to ${newState}`)
      entryState.state = ROOM_RESULT_STATE.ERROR
      entryState.error = true
      entryState.errorMessage = `Invalid state transition from ${currentState} to ${newState}`
      return
    }
    entryState.state = newState

    console.log("NEW STATE", entryState.state)
  }

  const transitionToResultSummary = (result?: EnterRoomReturnValue) => {
    console.log("Transition called")
    if (result) {
      transitionTo(determineResultSummaryState(result))
    } else {
      transitionTo(ROOM_RESULT_STATE.RESULT_SUMMARY_NORMAL)
    }
  }

  return {
    transitionTo,
    transitionToResultSummary
  }
}
