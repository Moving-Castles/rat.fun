import type { Snapshot } from "./$types"
import { get } from "svelte/store"
import { errorHandler } from "$lib/modules/error-handling"
import { InvalidStateTransitionError } from "$lib/modules/error-handling/errors"
import { page } from "$app/state"
import { rat, ratInventory } from "$lib/modules/state/stores"
import { adminUnlockedAt } from "$lib/modules/ui/state.svelte"
import { environment } from "$lib/modules/network"

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
  NO_TOKENS = "NO_TOKENS",
  NO_ALLOWANCE = "NO_ALLOWANCE",
  NO_RAT = "NO_RAT",
  DEPLOYING_RAT = "DEPLOYING_RAT",
  HAS_RAT = "HAS_RAT",
  CONFIRM_LIQUIDATION = "CONFIRM_LIQUIDATION",
  LIQUIDATING_RAT = "LIQUIDATING_RAT",
  DEAD_RAT = "DEAD_RAT",
  PAST_TRIP_LIST = "PAST_TRIP_LIST",
  PAST_TRIP_ENTRY = "PAST_TRIP_ENTRY",
  ERROR = "ERROR"
}

// Local state
let ratBoxState = $state<RAT_BOX_STATE>(RAT_BOX_STATE.INIT)
let ratBoxBalance = $state<number>(0)
let ratBoxInventory = $state<any[]>([])

/**
 * Defines valid state transitions between rat box states
 * Maps each state to an array of valid states it can transition to
 */
const VALID_TRANSITIONS: Record<RAT_BOX_STATE, RAT_BOX_STATE[]> = {
  [RAT_BOX_STATE.INIT]: [
    RAT_BOX_STATE.NO_TOKENS,
    RAT_BOX_STATE.NO_ALLOWANCE,
    RAT_BOX_STATE.NO_RAT,
    RAT_BOX_STATE.HAS_RAT,
    RAT_BOX_STATE.DEAD_RAT,
    RAT_BOX_STATE.ERROR
  ],
  [RAT_BOX_STATE.NO_TOKENS]: [
    RAT_BOX_STATE.NO_ALLOWANCE,
    RAT_BOX_STATE.NO_RAT,
    RAT_BOX_STATE.ERROR
  ],
  [RAT_BOX_STATE.NO_ALLOWANCE]: [RAT_BOX_STATE.NO_RAT, RAT_BOX_STATE.ERROR],
  [RAT_BOX_STATE.NO_RAT]: [RAT_BOX_STATE.DEPLOYING_RAT, RAT_BOX_STATE.ERROR],
  [RAT_BOX_STATE.DEPLOYING_RAT]: [RAT_BOX_STATE.HAS_RAT, RAT_BOX_STATE.ERROR],
  [RAT_BOX_STATE.HAS_RAT]: [
    RAT_BOX_STATE.DEAD_RAT,
    RAT_BOX_STATE.CONFIRM_LIQUIDATION,
    RAT_BOX_STATE.PAST_TRIP_LIST,
    RAT_BOX_STATE.ERROR
  ],
  [RAT_BOX_STATE.PAST_TRIP_LIST]: [
    RAT_BOX_STATE.PAST_TRIP_ENTRY,
    RAT_BOX_STATE.HAS_RAT,
    RAT_BOX_STATE.ERROR
  ],
  [RAT_BOX_STATE.PAST_TRIP_ENTRY]: [RAT_BOX_STATE.PAST_TRIP_LIST, RAT_BOX_STATE.ERROR],
  [RAT_BOX_STATE.CONFIRM_LIQUIDATION]: [
    RAT_BOX_STATE.HAS_RAT,
    RAT_BOX_STATE.LIQUIDATING_RAT,
    RAT_BOX_STATE.ERROR
  ],
  [RAT_BOX_STATE.DEAD_RAT]: [RAT_BOX_STATE.NO_RAT, RAT_BOX_STATE.ERROR],
  [RAT_BOX_STATE.LIQUIDATING_RAT]: [RAT_BOX_STATE.DEAD_RAT, RAT_BOX_STATE.ERROR],
  [RAT_BOX_STATE.ERROR]: []
}

const setRatBoxBalance = (balance: number | BigInt) => {
  ratBoxBalance = Number(balance)
}

const setRatBoxState = (state: RAT_BOX_STATE) => {
  console.log("Setting rbs", state)
  ratBoxState = state
}

const transitionTo = (newState: RAT_BOX_STATE) => {
  if (newState === ratBoxState) return
  const validTransitions = VALID_TRANSITIONS[ratBoxState]
  if (!validTransitions.includes(newState)) {
    const err = new InvalidStateTransitionError(
      undefined,
      undefined,
      `Invalid state transition from ${ratBoxState} to ${newState}`
    )
    errorHandler(err)
    return
  }
  setRatBoxState(newState)
}

const setRatBoxInventory = (inventory: any[]) => {
  ratBoxInventory = inventory
}

// Export singleton instance instead of factory function
export const ratState = {
  state: {
    set: setRatBoxState,
    transitionTo,
    get current() {
      return ratBoxState
    }
  },
  balance: {
    set: setRatBoxBalance,
    get current() {
      return ratBoxBalance
    }
  },
  inventory: {
    set: setRatBoxInventory,
    get current() {
      return ratBoxInventory
    }
  }
}

// Keep for backwards compatibility if needed
export const getRatState = () => ratState

// Managed state
export const capture = () => {
  const _rat = get(rat)
  const _ratInventory = get(ratInventory)
  const currentEnv = get(environment)

  const currentState = {
    environment: currentEnv,
    adminUnlockedAt: get(adminUnlockedAt),
    ratBoxState: ratState.state.current,
    ratBoxBalance: Number(_rat?.balance ?? ratState.balance.current ?? 0),
    ratBoxInventory: _ratInventory || ratState.inventory.current || []
  }

  if (page?.route?.id?.includes("tripping")) {
    return undefined
  } else {
    return JSON.stringify(currentState)
  }
}

export const restore = value => {
  if (!value) return

  console.log("restore!", value)
  const parsedValue = JSON.parse(value)
  const currentEnv = get(environment)

  // Only restore if the snapshot is from the same environment
  if (parsedValue.environment !== currentEnv) {
    console.log(
      `Skipping restore: snapshot is from ${parsedValue.environment}, current env is ${currentEnv}`
    )
    return
  }

  // Restore admin state
  adminUnlockedAt.set(parsedValue.adminUnlockedAt)

  // Restore rat state - must happen before components mount
  if (parsedValue.ratBoxState) {
    ratState.state.set(parsedValue.ratBoxState)
  }

  // Always set balance, even if 0
  const balanceValue = Number(parsedValue.ratBoxBalance ?? 0)
  if (!isNaN(balanceValue)) {
    ratState.balance.set(balanceValue)
    console.log("restored balance", balanceValue)
  }

  // Restore inventory
  if (Array.isArray(parsedValue.ratBoxInventory)) {
    ratState.inventory.set(parsedValue.ratBoxInventory)
    console.log("restored inventory", parsedValue.ratBoxInventory.length, "items")
  }
}
