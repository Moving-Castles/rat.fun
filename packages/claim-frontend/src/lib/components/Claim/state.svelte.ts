import { errorHandler } from "$lib/modules/error-handling"
import { InvalidStateTransitionError } from "$lib/modules/error-handling/errors"

/**
 * ========================================
 *  Claim/state.svelte.ts
 * ========================================
 * This module keeps track of the state of the claim flow.
 *
 * Flow:
 * 1. Make user connect wallet
 * ??
 * N. When user has claimed show message with link to https://rat.fun
 */

export enum CLAIM_STATE {
  INIT = "INIT",
  CONNECT_WALLET = "CONNECT_WALLET",
  CHECKING = "CHECKING",
  AVAILABLE = "AVAILABLE",
  NOT_AVAILABLE = "NOT_AVAILABLE",
  DONE = "DONE",
  ERROR = "ERROR"
}

// Local state
let claimStateValue = $state<CLAIM_STATE>(CLAIM_STATE.INIT)

/**
 * Defines valid state transitions between claim states
 * Maps each state to an array of valid states it can transition to
 */
const VALID_TRANSITIONS: Record<CLAIM_STATE, CLAIM_STATE[]> = {
  [CLAIM_STATE.INIT]: [CLAIM_STATE.CONNECT_WALLET, CLAIM_STATE.CHECKING, CLAIM_STATE.ERROR],
  [CLAIM_STATE.CONNECT_WALLET]: [CLAIM_STATE.CHECKING, CLAIM_STATE.ERROR],
  [CLAIM_STATE.CHECKING]: [
    CLAIM_STATE.AVAILABLE,
    CLAIM_STATE.NOT_AVAILABLE,
    CLAIM_STATE.DONE,
    CLAIM_STATE.ERROR
  ],
  [CLAIM_STATE.AVAILABLE]: [CLAIM_STATE.DONE, CLAIM_STATE.ERROR],
  [CLAIM_STATE.NOT_AVAILABLE]: [],
  [CLAIM_STATE.DONE]: [],
  [CLAIM_STATE.ERROR]: []
}

const setExchangeState = (state: CLAIM_STATE) => {
  claimStateValue = state
}

const resetExchangeState = () => {
  claimStateValue = CLAIM_STATE.INIT
}

const transitionTo = (newState: CLAIM_STATE) => {
  if (newState === claimStateValue) return
  const validTransitions = VALID_TRANSITIONS[claimStateValue]
  if (!validTransitions.includes(newState)) {
    const err = new InvalidStateTransitionError(
      undefined,
      undefined,
      `Invalid state transition from ${claimStateValue} to ${newState}`
    )
    errorHandler(err)
    return
  }
  setExchangeState(newState)
}

// Export singleton instance
export const claimState = {
  state: {
    reset: resetExchangeState,
    set: setExchangeState,
    transitionTo,
    get current() {
      return claimStateValue
    }
  }
}
