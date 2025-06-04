import type { EnterRoomReturnValue } from "@server/modules/types"

// The user can be in four discrete, sequential states:
// 1. Splash screen
// 2. Waiting for result
// 3. Showing results
// 4. Result summary
// And additionally:
// X. Error
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

// Define valid state transitions
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

// Show info boxes unless we are in splash screen or error state
export const SHOW_INFO_BOXES = [
  ROOM_RESULT_STATE.WAITING_FOR_RESULT,
  ROOM_RESULT_STATE.SHOWING_RESULTS,
  ROOM_RESULT_STATE.RESULT_SUMMARY_NORMAL,
  ROOM_RESULT_STATE.RESULT_SUMMARY_RAT_DEAD,
  ROOM_RESULT_STATE.RESULT_SUMMARY_LEVEL_UP,
  ROOM_RESULT_STATE.RESULT_SUMMARY_LEVEL_DOWN,
]

// Show log
export const SHOW_LOG = [
  ROOM_RESULT_STATE.SHOWING_RESULTS,
  ROOM_RESULT_STATE.RESULT_SUMMARY_NORMAL,
  ROOM_RESULT_STATE.RESULT_SUMMARY_RAT_DEAD,
  ROOM_RESULT_STATE.RESULT_SUMMARY_LEVEL_UP,
  ROOM_RESULT_STATE.RESULT_SUMMARY_LEVEL_DOWN
]

// Stores the current state of the room result
export let roomResultState: {state: ROOM_RESULT_STATE, errorMessage: string | null} = $state({
  state: ROOM_RESULT_STATE.SPLASH_SCREEN,
  errorMessage: null
})

// Transitions to the result summary state, based on the result
export const transitionToResultSummary = (result: EnterRoomReturnValue) => {
  transitionTo(determineResultSummaryState(result))
}

// Transitions to a new state, if the transition is valid
export const transitionTo = (newState: ROOM_RESULT_STATE) => {
  const validTransitions = VALID_TRANSITIONS[roomResultState.state]
  if (!validTransitions.includes(newState)) {
    console.error(`Invalid state transition from ${roomResultState} to ${newState}`)
    return
  }
  roomResultState.state = newState
}
// Resets the room result state to the splash screen
export const resetRoomResultState = () => {
  roomResultState.state = ROOM_RESULT_STATE.SPLASH_SCREEN
  roomResultState.errorMessage = null
}

// Determine which result summary state to transition to, based on the result
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