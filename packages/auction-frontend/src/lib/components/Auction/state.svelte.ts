import { errorHandler } from "$lib/modules/error-handling"
import { InvalidStateTransitionError } from "$lib/modules/error-handling/errors"

/**
 * ========================================
 *  Auction/state.svelte.ts
 * ========================================
 * This module keeps track of the state of the auction flow.
 *
 * Flow:
 * 1. If auction time ended, or it exited early, show ended message
 * 2. Make user connect wallet
 * 3. Make user set country code (required by token contract to emit correct Receipt)
 * 4. Allow user to select currency with which to purchase $RAT tokens
 * 5. Quote input/output depending on which currency user inputs
 * 6. ... permit and routing TBD
 * 7. When user has reached purchase limit show message with link to https://rat.fun
 */

export enum AUCTION_STATE {
  INIT = "INIT",
  CONNECT_WALLET = "CONNECT_WALLET",
  CHECKING = "CHECKING",
  COUNTRY_CODE = "COUNTRY_CODE",
  AVAILABLE = "AVAILABLE",
  ENDED = "ENDED",
  WALLET_LIMIT_REACHED = "WALLET_LIMIT_REACHED",
  ERROR = "ERROR"
}

// Local state
let auctionStateValue = $state<AUCTION_STATE>(AUCTION_STATE.INIT)

/**
 * Defines valid state transitions between auction states
 * Maps each state to an array of valid states it can transition to
 */
const VALID_TRANSITIONS: Record<AUCTION_STATE, AUCTION_STATE[]> = {
  [AUCTION_STATE.INIT]: [
    AUCTION_STATE.CONNECT_WALLET,
    AUCTION_STATE.CHECKING,
    AUCTION_STATE.ENDED,
    AUCTION_STATE.ERROR
  ],
  [AUCTION_STATE.CONNECT_WALLET]: [
    AUCTION_STATE.CHECKING,
    AUCTION_STATE.ENDED,
    AUCTION_STATE.ERROR
  ],
  [AUCTION_STATE.CHECKING]: [
    AUCTION_STATE.COUNTRY_CODE,
    AUCTION_STATE.AVAILABLE,
    AUCTION_STATE.ENDED,
    AUCTION_STATE.WALLET_LIMIT_REACHED,
    AUCTION_STATE.ERROR
  ],
  [AUCTION_STATE.COUNTRY_CODE]: [AUCTION_STATE.AVAILABLE, AUCTION_STATE.ENDED, AUCTION_STATE.ERROR],
  [AUCTION_STATE.AVAILABLE]: [
    AUCTION_STATE.ENDED,
    AUCTION_STATE.WALLET_LIMIT_REACHED,
    AUCTION_STATE.ERROR
  ],
  [AUCTION_STATE.ENDED]: [],
  [AUCTION_STATE.WALLET_LIMIT_REACHED]: [AUCTION_STATE.ENDED],
  [AUCTION_STATE.ERROR]: []
}

const setState = (state: AUCTION_STATE) => {
  auctionStateValue = state
}

const resetState = () => {
  auctionStateValue = AUCTION_STATE.INIT
}

const transitionTo = (newState: AUCTION_STATE) => {
  if (newState === auctionStateValue) return
  const validTransitions = VALID_TRANSITIONS[auctionStateValue]
  if (!validTransitions.includes(newState)) {
    const err = new InvalidStateTransitionError(
      undefined,
      undefined,
      `Invalid state transition from ${auctionStateValue} to ${newState}`
    )
    errorHandler(err)
    return
  }
  setState(newState)
}

// Export singleton instance
export const auctionState = {
  state: {
    reset: resetState,
    set: setState,
    transitionTo,
    get current() {
      return auctionStateValue
    }
  }
}
