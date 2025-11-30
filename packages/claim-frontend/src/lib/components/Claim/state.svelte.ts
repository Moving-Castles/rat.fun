import { errorHandler } from "$lib/modules/error-handling"
import { InvalidStateTransitionError } from "$lib/modules/error-handling/errors"

/**
 * ========================================
 *  Claim/state.svelte.ts
 * ========================================
 * This module keeps track of the outer claim state.
 * Handles wallet connection and eligibility check.
 *
 * Flow:
 * 1. INIT → initial state
 * 2. CONNECT_WALLET → waiting for wallet connection
 * 3. CLAIM → user is eligible, hand off to ClaimFlow
 * 4. NOT_ELIGIBLE → user not in merkle tree
 * 5. ERROR → fatal error
 */

export enum CLAIM_STATE {
  INIT = "INIT",
  CONNECT_WALLET = "CONNECT_WALLET",
  CLAIM = "CLAIM",
  NOT_ELIGIBLE = "NOT_ELIGIBLE",
  ERROR = "ERROR"
}

// Local state
let stateValue = $state<CLAIM_STATE>(CLAIM_STATE.INIT)

/**
 * Defines valid state transitions
 */
const VALID_TRANSITIONS: Record<CLAIM_STATE, CLAIM_STATE[]> = {
  [CLAIM_STATE.INIT]: [CLAIM_STATE.CONNECT_WALLET, CLAIM_STATE.CLAIM, CLAIM_STATE.ERROR],
  [CLAIM_STATE.CONNECT_WALLET]: [CLAIM_STATE.CLAIM, CLAIM_STATE.NOT_ELIGIBLE, CLAIM_STATE.ERROR],
  [CLAIM_STATE.CLAIM]: [CLAIM_STATE.ERROR],
  [CLAIM_STATE.NOT_ELIGIBLE]: [],
  [CLAIM_STATE.ERROR]: []
}

const setState = (state: CLAIM_STATE) => {
  stateValue = state
}

const resetState = () => {
  stateValue = CLAIM_STATE.INIT
}

const transitionTo = (newState: CLAIM_STATE) => {
  if (newState === stateValue) return
  const validTransitions = VALID_TRANSITIONS[stateValue]
  if (!validTransitions.includes(newState)) {
    const err = new InvalidStateTransitionError(
      undefined,
      undefined,
      `Invalid claim state transition from ${stateValue} to ${newState}`
    )
    errorHandler(err)
    return
  }
  setState(newState)
}

// Export singleton instance
export const claimState = {
  state: {
    reset: resetState,
    set: setState,
    transitionTo,
    get current() {
      return stateValue
    }
  }
}
