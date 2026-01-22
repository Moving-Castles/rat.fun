import { errorHandler } from "$lib/modules/error-handling"
import { InvalidStateTransitionError } from "@ratfun/common/error-handling"

/**
 * ========================================
 *  Auction/state.svelte.ts
 * ========================================
 * This module keeps track of the state of the auction flow.
 *
 */

export enum AUCTION_STATE {
  INIT = "INIT",
  COUNTRY_BLOCKED = "COUNTRY_BLOCKED",
  CONNECT_WALLET = "CONNECT_WALLET",
  SWAP = "SWAP",
  NOT_STARTED = "NOT_STARTED",
  WAITING_FOR_EPOCH = "WAITING_FOR_EPOCH",
  ENDED = "ENDED",
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
    AUCTION_STATE.COUNTRY_BLOCKED,
    AUCTION_STATE.CONNECT_WALLET,
    AUCTION_STATE.SWAP,
    AUCTION_STATE.NOT_STARTED,
    AUCTION_STATE.WAITING_FOR_EPOCH,
    AUCTION_STATE.ENDED,
    AUCTION_STATE.ERROR
  ],
  [AUCTION_STATE.COUNTRY_BLOCKED]: [],
  [AUCTION_STATE.CONNECT_WALLET]: [AUCTION_STATE.SWAP, AUCTION_STATE.ENDED, AUCTION_STATE.ERROR],
  [AUCTION_STATE.SWAP]: [AUCTION_STATE.ENDED, AUCTION_STATE.ERROR],
  [AUCTION_STATE.NOT_STARTED]: [],
  [AUCTION_STATE.WAITING_FOR_EPOCH]: [],
  [AUCTION_STATE.ENDED]: [],
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
