import { errorHandler } from "$lib/modules/error-handling"
import { InvalidStateTransitionError } from "$lib/modules/error-handling/errors"

/**
 * ========================================
 *  Exchange/state.svelte.ts
 * ========================================
 * This module keeps track of the outer exchange state.
 * Handles wallet connection and FakeRAT balance check.
 *
 * Flow:
 * 1. INIT → initial state
 * 2. CONNECT_WALLET → waiting for wallet connection
 * 3. EXCHANGE → user has FakeRAT, hand off to ExchangeFlow
 * 4. NO_TOKENS → user has no FakeRAT tokens
 * 5. ERROR → fatal error
 */

export enum EXCHANGE_STATE {
  INIT = "INIT",
  CONNECT_WALLET = "CONNECT_WALLET",
  EXCHANGE = "EXCHANGE",
  NO_TOKENS = "NO_TOKENS",
  ERROR = "ERROR"
}

// Local state
let stateValue = $state<EXCHANGE_STATE>(EXCHANGE_STATE.INIT)

/**
 * Defines valid state transitions
 */
const VALID_TRANSITIONS: Record<EXCHANGE_STATE, EXCHANGE_STATE[]> = {
  [EXCHANGE_STATE.INIT]: [
    EXCHANGE_STATE.CONNECT_WALLET,
    EXCHANGE_STATE.EXCHANGE,
    EXCHANGE_STATE.NO_TOKENS,
    EXCHANGE_STATE.ERROR
  ],
  [EXCHANGE_STATE.CONNECT_WALLET]: [
    EXCHANGE_STATE.EXCHANGE,
    EXCHANGE_STATE.NO_TOKENS,
    EXCHANGE_STATE.ERROR
  ],
  [EXCHANGE_STATE.EXCHANGE]: [EXCHANGE_STATE.ERROR],
  [EXCHANGE_STATE.NO_TOKENS]: [
    EXCHANGE_STATE.CONNECT_WALLET,
    EXCHANGE_STATE.EXCHANGE,
    EXCHANGE_STATE.ERROR
  ],
  [EXCHANGE_STATE.ERROR]: []
}

const setState = (state: EXCHANGE_STATE) => {
  stateValue = state
}

const resetState = () => {
  stateValue = EXCHANGE_STATE.INIT
}

const transitionTo = (newState: EXCHANGE_STATE) => {
  if (newState === stateValue) return
  const validTransitions = VALID_TRANSITIONS[stateValue]
  if (!validTransitions.includes(newState)) {
    const err = new InvalidStateTransitionError(
      undefined,
      undefined,
      `Invalid exchange state transition from ${stateValue} to ${newState}`
    )
    errorHandler(err)
    return
  }
  setState(newState)
}

// Export singleton instance
export const exchangeState = {
  state: {
    reset: resetState,
    set: setState,
    transitionTo,
    get current() {
      return stateValue
    }
  }
}
