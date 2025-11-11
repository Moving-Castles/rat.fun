import { errorHandler } from "$lib/modules/error-handling"
import { InvalidStateTransitionError } from "$lib/modules/error-handling/errors"

/**
 * ========================================
 *  Exchange/state.svelte.ts
 * ========================================
 * This module keeps track of the state of the exchange flow.
 *
 * Flow:
 * 1. Make user connect wallet
 * 2. Check if user has $FAKERAT tokens
 * 3. If user has no tokens, show no tokens message
 * 4. If user has tokens, show approve button
 * 5. When user has approved, show exchange button
 * 6. When user has exchanged show message with link to https://rat.fun
 */

export enum EXCHANGE_STATE {
  INIT = "INIT",
  CONNECT_WALLET = "CONNECT_WALLET",
  NO_TOKENS = "NO_TOKENS",
  APPROVE = "APPROVE",
  EXCHANGE = "EXCHANGE",
  DONE = "DONE",
  ERROR = "ERROR"
}

// Local state
let exchangeStateValue = $state<EXCHANGE_STATE>(EXCHANGE_STATE.INIT)

/**
 * Defines valid state transitions between exchange states
 * Maps each state to an array of valid states it can transition to
 */
const VALID_TRANSITIONS: Record<EXCHANGE_STATE, EXCHANGE_STATE[]> = {
  [EXCHANGE_STATE.INIT]: [
    EXCHANGE_STATE.CONNECT_WALLET,
    EXCHANGE_STATE.NO_TOKENS,
    EXCHANGE_STATE.APPROVE,
    EXCHANGE_STATE.EXCHANGE,
    EXCHANGE_STATE.DONE,
    EXCHANGE_STATE.ERROR
  ],
  [EXCHANGE_STATE.CONNECT_WALLET]: [
    EXCHANGE_STATE.NO_TOKENS,
    EXCHANGE_STATE.APPROVE,
    EXCHANGE_STATE.EXCHANGE,
    EXCHANGE_STATE.ERROR
  ],
  [EXCHANGE_STATE.NO_TOKENS]: [EXCHANGE_STATE.APPROVE, EXCHANGE_STATE.ERROR],
  [EXCHANGE_STATE.APPROVE]: [EXCHANGE_STATE.EXCHANGE, EXCHANGE_STATE.ERROR],
  [EXCHANGE_STATE.EXCHANGE]: [EXCHANGE_STATE.DONE, EXCHANGE_STATE.ERROR],
  [EXCHANGE_STATE.DONE]: [],
  [EXCHANGE_STATE.ERROR]: []
}

const setExchangeState = (state: EXCHANGE_STATE) => {
  exchangeStateValue = state
}

const resetExchangeState = () => {
  exchangeStateValue = EXCHANGE_STATE.INIT
}

const transitionTo = (newState: EXCHANGE_STATE) => {
  if (newState === exchangeStateValue) return
  const validTransitions = VALID_TRANSITIONS[exchangeStateValue]
  if (!validTransitions.includes(newState)) {
    const err = new InvalidStateTransitionError(
      undefined,
      undefined,
      `Invalid state transition from ${exchangeStateValue} to ${newState}`
    )
    errorHandler(err)
    return
  }
  setExchangeState(newState)
}

// Export singleton instance
export const exchangeState = {
  state: {
    reset: resetExchangeState,
    set: setExchangeState,
    transitionTo,
    get current() {
      return exchangeStateValue
    }
  }
}
