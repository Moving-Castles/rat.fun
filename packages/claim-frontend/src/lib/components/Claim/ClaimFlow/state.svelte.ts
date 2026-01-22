import { errorHandler } from "$lib/modules/error-handling"
import { InvalidStateTransitionError } from "$lib/modules/error-handling"
import type { GetProofReturnType } from "merkle-tree-airdrop"
import type { Hex } from "viem"

/**
 * ========================================
 *  ClaimFlow/state.svelte.ts
 * ========================================
 * This module keeps track of the inner claim flow state.
 * It also holds all shared data needed across claim flow components.
 *
 * Flow:
 * 1. INIT → just entered the claim flow
 * 2. CHECKING → fetching proof + checking hasClaimed status
 * 3. READY → user can claim, show amount + button
 * 4. CLAIMING → transaction in progress
 * 5. COMPLETE → successfully claimed
 * 6. ERROR → claim failed
 */

export enum CLAIM_FLOW_STATE {
  INIT = "INIT",
  CHECKING = "CHECKING",
  READY = "READY",
  CLAIMING = "CLAIMING",
  COMPLETE = "COMPLETE",
  ERROR = "ERROR"
}

// Local state
let stateValue = $state<CLAIM_FLOW_STATE>(CLAIM_FLOW_STATE.INIT)

// Shared data state
let proof = $state<GetProofReturnType | null>(null)
let txHash = $state<Hex | null>(null)
let errorMessage = $state<string | null>(null)

/**
 * Defines valid state transitions
 */
const VALID_TRANSITIONS: Record<CLAIM_FLOW_STATE, CLAIM_FLOW_STATE[]> = {
  [CLAIM_FLOW_STATE.INIT]: [CLAIM_FLOW_STATE.CHECKING, CLAIM_FLOW_STATE.ERROR],
  [CLAIM_FLOW_STATE.CHECKING]: [
    CLAIM_FLOW_STATE.READY,
    CLAIM_FLOW_STATE.COMPLETE, // Already claimed
    CLAIM_FLOW_STATE.ERROR
  ],
  [CLAIM_FLOW_STATE.READY]: [CLAIM_FLOW_STATE.CLAIMING, CLAIM_FLOW_STATE.ERROR],
  [CLAIM_FLOW_STATE.CLAIMING]: [CLAIM_FLOW_STATE.COMPLETE, CLAIM_FLOW_STATE.ERROR],
  [CLAIM_FLOW_STATE.COMPLETE]: [],
  [CLAIM_FLOW_STATE.ERROR]: []
}

const setState = (state: CLAIM_FLOW_STATE) => {
  stateValue = state
}

const resetState = () => {
  stateValue = CLAIM_FLOW_STATE.INIT
}

const resetData = () => {
  proof = null
  txHash = null
  errorMessage = null
}

const transitionTo = (newState: CLAIM_FLOW_STATE) => {
  if (newState === stateValue) return
  const validTransitions = VALID_TRANSITIONS[stateValue]
  if (!validTransitions.includes(newState)) {
    const err = new InvalidStateTransitionError(
      undefined,
      undefined,
      `Invalid claim flow state transition from ${stateValue} to ${newState}`
    )
    errorHandler(err)
    return
  }
  setState(newState)
}

// Export singleton instance
export const claimFlowState = {
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
    get proof() {
      return proof
    },
    get claimAmount() {
      return proof?.value ?? 0n
    },
    get txHash() {
      return txHash
    },
    get errorMessage() {
      return errorMessage
    },

    // Setters
    setProof: (p: GetProofReturnType | null) => {
      proof = p
    },
    setTxHash: (hash: Hex | null) => {
      txHash = hash
    },
    setErrorMessage: (msg: string | null) => {
      errorMessage = msg
    },

    // Reset
    reset: resetData
  }
}
