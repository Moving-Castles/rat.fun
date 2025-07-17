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
  NO_RAT = "NO_RAT",
  DEPLOYING_RAT = "DEPLOYING_RAT",
  HAS_RAT = "HAS_RAT",
  DEAD_RAT = "DEAD_RAT",
  CONFIRM_LIQUIDATION = "CONFIRM_LIQUIDATION",
  LIQUIDATING_RAT = "LIQUIDATING_RAT",
  ERROR = "ERROR"
}

/** Current state of the rat box flow */
export const ratBoxState: { state: RAT_BOX_STATE; errorMessage: string | null } = $state({
  state: RAT_BOX_STATE.INIT,
  errorMessage: null
})

/**
 * Defines valid state transitions between rat box states
 * Maps each state to an array of valid states it can transition to
 */
const VALID_TRANSITIONS: Record<RAT_BOX_STATE, RAT_BOX_STATE[]> = {
  [RAT_BOX_STATE.INIT]: [
    RAT_BOX_STATE.HAS_RAT,
    RAT_BOX_STATE.DEAD_RAT,
    RAT_BOX_STATE.NO_RAT,
    RAT_BOX_STATE.ERROR
  ],
  [RAT_BOX_STATE.NO_RAT]: [RAT_BOX_STATE.DEPLOYING_RAT, RAT_BOX_STATE.ERROR],
  [RAT_BOX_STATE.DEPLOYING_RAT]: [RAT_BOX_STATE.HAS_RAT, RAT_BOX_STATE.ERROR],
  [RAT_BOX_STATE.HAS_RAT]: [
    RAT_BOX_STATE.DEAD_RAT,
    RAT_BOX_STATE.CONFIRM_LIQUIDATION,
    RAT_BOX_STATE.ERROR
  ],
  [RAT_BOX_STATE.CONFIRM_LIQUIDATION]: [
    RAT_BOX_STATE.HAS_RAT,
    RAT_BOX_STATE.LIQUIDATING_RAT,
    RAT_BOX_STATE.ERROR
  ],
  [RAT_BOX_STATE.DEAD_RAT]: [RAT_BOX_STATE.NO_RAT, RAT_BOX_STATE.ERROR],
  [RAT_BOX_STATE.LIQUIDATING_RAT]: [RAT_BOX_STATE.DEAD_RAT, RAT_BOX_STATE.ERROR],
  [RAT_BOX_STATE.ERROR]: []
}

/**
 * Transitions to a new state if the transition is valid
 * @param newState The state to transition to
 */
export const transitionTo = (newState: RAT_BOX_STATE) => {
  const validTransitions = VALID_TRANSITIONS[ratBoxState.state]
  if (!validTransitions.includes(newState)) {
    console.error(`Invalid state transition from ${ratBoxState.state} to ${newState}`)
    return
  }
  ratBoxState.state = newState
}

/**
 * Resets the rat box state to the initial state
 */
export const resetRatBoxState = () => {
  ratBoxState.state = RAT_BOX_STATE.INIT
  ratBoxState.errorMessage = null
}
