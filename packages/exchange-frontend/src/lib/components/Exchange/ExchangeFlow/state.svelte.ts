import { errorHandler } from "$lib/modules/error-handling"
import { InvalidStateTransitionError } from "$lib/modules/error-handling/errors"
import type { Hex } from "viem"

/**
 * ========================================
 *  ExchangeFlow/state.svelte.ts
 * ========================================
 * This module keeps track of the inner exchange flow state.
 * It also holds all shared data needed across exchange flow components.
 *
 * Flow:
 * 1. INIT → just entered the exchange flow
 * 2. READY → user has FakeRAT, show amount + button
 * 3. APPROVING → approval transaction in progress
 * 4. EXCHANGING → exchange transaction in progress
 * 5. COMPLETE → successfully exchanged
 * 6. ERROR → exchange failed
 */

export enum EXCHANGE_FLOW_STATE {
  INIT = "INIT",
  READY = "READY",
  APPROVING = "APPROVING",
  EXCHANGING = "EXCHANGING",
  COMPLETE = "COMPLETE",
  ERROR = "ERROR"
}

// Local state
let stateValue = $state<EXCHANGE_FLOW_STATE>(EXCHANGE_FLOW_STATE.INIT)

// Shared data state
let exchangeAmount = $state<number>(0)
let approveTxHash = $state<Hex | null>(null)
let exchangeTxHash = $state<Hex | null>(null)
let errorMessage = $state<string | null>(null)

/**
 * Defines valid state transitions
 */
const VALID_TRANSITIONS: Record<EXCHANGE_FLOW_STATE, EXCHANGE_FLOW_STATE[]> = {
  [EXCHANGE_FLOW_STATE.INIT]: [EXCHANGE_FLOW_STATE.READY, EXCHANGE_FLOW_STATE.ERROR],
  [EXCHANGE_FLOW_STATE.READY]: [EXCHANGE_FLOW_STATE.APPROVING, EXCHANGE_FLOW_STATE.ERROR],
  [EXCHANGE_FLOW_STATE.APPROVING]: [EXCHANGE_FLOW_STATE.EXCHANGING, EXCHANGE_FLOW_STATE.ERROR],
  [EXCHANGE_FLOW_STATE.EXCHANGING]: [EXCHANGE_FLOW_STATE.COMPLETE, EXCHANGE_FLOW_STATE.ERROR],
  [EXCHANGE_FLOW_STATE.COMPLETE]: [],
  [EXCHANGE_FLOW_STATE.ERROR]: []
}

const setState = (state: EXCHANGE_FLOW_STATE) => {
  stateValue = state
}

const resetState = () => {
  stateValue = EXCHANGE_FLOW_STATE.INIT
}

const resetData = () => {
  exchangeAmount = 0
  approveTxHash = null
  exchangeTxHash = null
  errorMessage = null
}

const transitionTo = (newState: EXCHANGE_FLOW_STATE) => {
  if (newState === stateValue) return
  const validTransitions = VALID_TRANSITIONS[stateValue]
  if (!validTransitions.includes(newState)) {
    const err = new InvalidStateTransitionError(
      undefined,
      undefined,
      `Invalid exchange flow state transition from ${stateValue} to ${newState}`
    )
    errorHandler(err)
    return
  }
  setState(newState)
}

// Export singleton instance
export const exchangeFlowState = {
  state: {
    reset: resetState,
    set: setState,
    transitionTo,
    get current() {
      return stateValue
    }
  },
  data: {
    // Getters
    get exchangeAmount() {
      return exchangeAmount
    },
    get approveTxHash() {
      return approveTxHash
    },
    get exchangeTxHash() {
      return exchangeTxHash
    },
    get errorMessage() {
      return errorMessage
    },

    // Setters
    setExchangeAmount: (amount: number) => {
      exchangeAmount = amount
    },
    setApproveTxHash: (hash: Hex | null) => {
      approveTxHash = hash
    },
    setExchangeTxHash: (hash: Hex | null) => {
      exchangeTxHash = hash
    },
    setErrorMessage: (msg: string | null) => {
      errorMessage = msg
    },

    // Reset
    reset: resetData
  }
}
