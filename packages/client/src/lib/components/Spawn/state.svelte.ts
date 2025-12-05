import { errorHandler } from "$lib/modules/error-handling"
import { InvalidStateTransitionError } from "@ratfun/common/error-handling"

/**
 * ========================================
 *  Spawn/state.svelte.ts
 * ========================================
 * This module keeps track of the state of the spawn flow.
 */

/*
 * ─────────────────────────────────────────────
 * Spawn Flow State
 * ─────────────────────────────────────────────
 * The spawn flow is modeled as a state machine.
 */

export enum SPAWN_STATE {
  INIT = "INIT",
  CONNECT_WALLET = "CONNECT_WALLET",
  INTRODUCTION = "INTRODUCTION",
  RULE_OVERVIEW = "RULE_OVERVIEW",
  ALLOWANCE = "ALLOWANCE",
  ALLOWANCE__LOADING = "ALLOWANCE__LOADING",
  SESSION_AND_SPAWN = "SESSION_AND_SPAWN",
  SESSION_AND_SPAWN__LOADING = "SESSION_AND_SPAWN__LOADING",
  SESSION = "SESSION",
  SESSION__LOADING = "SESSION__LOADING",
  SPAWN = "SPAWN",
  SPAWN__LOADING = "SPAWN__LOADING",
  EXIT_FLOW = "EXIT_FLOW",
  DONE = "DONE",
  ERROR = "ERROR"
}

// Local state
let spawnStateValue = $state<SPAWN_STATE>(SPAWN_STATE.INIT)
let playerName = $state<string>("")
let onExitFlowCallback: (() => void) | null = null

/**
 * Defines valid state transitions between spawn states
 */
const VALID_TRANSITIONS: Record<SPAWN_STATE, SPAWN_STATE[]> = {
  [SPAWN_STATE.INIT]: [
    SPAWN_STATE.CONNECT_WALLET, // Scenarios 0-7: No wallet connected
    SPAWN_STATE.INTRODUCTION, // Scenario 8: Wallet, no session, no allowance, not spawned
    SPAWN_STATE.ALLOWANCE, // Scenarios 9, 12, 13: No allowance
    SPAWN_STATE.SESSION_AND_SPAWN, // Scenario 10: Wallet, no session, has allowance, not spawned
    SPAWN_STATE.SESSION, // Scenario 11: Wallet, no session, has allowance, spawned
    SPAWN_STATE.SPAWN, // Scenario 14: Wallet, session, has allowance, not spawned
    SPAWN_STATE.EXIT_FLOW, // Scenario 15: All setup, go to game
    SPAWN_STATE.ERROR
  ],
  [SPAWN_STATE.CONNECT_WALLET]: [
    SPAWN_STATE.INTRODUCTION, // Scenario 8: No session, no allowance, not spawned (new user)
    SPAWN_STATE.ALLOWANCE, // Scenarios 9, 12, 13: No allowance (returning user)
    SPAWN_STATE.SESSION_AND_SPAWN, // Scenario 10: Has allowance, no session, not spawned
    SPAWN_STATE.SESSION, // Scenario 11: Has allowance, no session, but is spawned
    SPAWN_STATE.SPAWN, // Scenario 14: Has session + allowance, not spawned
    SPAWN_STATE.EXIT_FLOW, // Scenario 15: Everything setup, go to game
    SPAWN_STATE.ERROR
  ],
  [SPAWN_STATE.INTRODUCTION]: [SPAWN_STATE.RULE_OVERVIEW, SPAWN_STATE.ERROR],
  [SPAWN_STATE.RULE_OVERVIEW]: [SPAWN_STATE.ALLOWANCE, SPAWN_STATE.ERROR],
  [SPAWN_STATE.ALLOWANCE]: [SPAWN_STATE.ALLOWANCE__LOADING, SPAWN_STATE.ERROR],
  [SPAWN_STATE.ALLOWANCE__LOADING]: [
    SPAWN_STATE.ALLOWANCE, // Return on error
    SPAWN_STATE.SPAWN,
    SPAWN_STATE.SESSION,
    SPAWN_STATE.SESSION_AND_SPAWN,
    SPAWN_STATE.EXIT_FLOW,
    SPAWN_STATE.ERROR
  ],
  [SPAWN_STATE.SESSION]: [SPAWN_STATE.SESSION__LOADING, SPAWN_STATE.ERROR],
  [SPAWN_STATE.SESSION__LOADING]: [
    SPAWN_STATE.SESSION, // Return on error
    SPAWN_STATE.SPAWN, // Session setup, but not spawned
    SPAWN_STATE.EXIT_FLOW, // Session setup and already spawned
    SPAWN_STATE.ERROR
  ],
  [SPAWN_STATE.SPAWN]: [SPAWN_STATE.SPAWN__LOADING, SPAWN_STATE.ERROR],
  [SPAWN_STATE.SPAWN__LOADING]: [
    SPAWN_STATE.SPAWN, // Return on error
    SPAWN_STATE.DONE,
    SPAWN_STATE.ERROR
  ],
  [SPAWN_STATE.SESSION_AND_SPAWN]: [SPAWN_STATE.SESSION_AND_SPAWN__LOADING, SPAWN_STATE.ERROR],
  [SPAWN_STATE.SESSION_AND_SPAWN__LOADING]: [
    SPAWN_STATE.SESSION_AND_SPAWN, // Return on error
    SPAWN_STATE.DONE,
    SPAWN_STATE.ERROR
  ],
  [SPAWN_STATE.DONE]: [SPAWN_STATE.EXIT_FLOW],
  [SPAWN_STATE.EXIT_FLOW]: [],
  [SPAWN_STATE.ERROR]: []
}

const setSpawnState = (state: SPAWN_STATE) => {
  spawnStateValue = state
}

const resetSpawnState = () => {
  spawnStateValue = SPAWN_STATE.INIT
  playerName = ""
}

const transitionTo = (newState: SPAWN_STATE) => {
  if (newState === spawnStateValue) return
  const validTransitions = VALID_TRANSITIONS[spawnStateValue]
  if (!validTransitions.includes(newState)) {
    const err = new InvalidStateTransitionError(
      undefined,
      undefined,
      `Invalid state transition from ${spawnStateValue} to ${newState}`
    )
    errorHandler(err)
    return
  }
  console.log(`[Spawn State] ${spawnStateValue} → ${newState}`)
  setSpawnState(newState)

  // Trigger callback when exiting the flow
  if (newState === SPAWN_STATE.EXIT_FLOW && onExitFlowCallback) {
    onExitFlowCallback()
  }
}

const setPlayerName = (name: string) => {
  playerName = name
}

const setOnExitFlow = (callback: () => void) => {
  onExitFlowCallback = callback
}

/*
 * ─────────────────────────────────────────────
 * Flow Context & Next State Determination
 * ─────────────────────────────────────────────
 *
 *  State determination based on:
 *  - walletConnected (wallet address available)
 *  - sessionReady (session is ready)
 *  - hasAllowance (user has approved allowance > 100 tokens)
 *  - spawned (player already spawned in the game)
 *
 *  +----+----------------+-------------+--------------+---------+-------------------+
 *  |    | walletConnected| sessionReady| hasAllowance | spawned | Initial State     |
 *  +----+----------------+-------------+--------------+---------+-------------------+
 *  |  0 |     false      |    false    |    false     |  false  | CONNECT_WALLET    |
 *  |  1 |     false      |    false    |    false     |  true   | CONNECT_WALLET    |
 *  |  2 |     false      |    false    |    true      |  false  | CONNECT_WALLET    |
 *  |  3 |     false      |    false    |    true      |  true   | CONNECT_WALLET    |
 *  |  4 |     false      |    true     |    false     |  false  | CONNECT_WALLET    |
 *  |  5 |     false      |    true     |    false     |  true   | CONNECT_WALLET    |
 *  |  6 |     false      |    true     |    true      |  false  | CONNECT_WALLET    |
 *  |  7 |     false      |    true     |    true      |  true   | CONNECT_WALLET    |
 *  |  8 |     true       |    false    |    false     |  false  | INTRODUCTION      |
 *  |  9 |     true       |    false    |    false     |  true   | ALLOWANCE         |
 *  | 10 |     true       |    false    |    true      |  false  | SESSION_AND_SPAWN |
 *  | 11 |     true       |    false    |    true      |  true   | SESSION           |
 *  | 12 |     true       |    true     |    false     |  false  | ALLOWANCE         |
 *  | 13 |     true       |    true     |    false     |  true   | ALLOWANCE         |
 *  | 14 |     true       |    true     |    true      |  false  | SPAWN             |
 *  | 15 |     true       |    true     |    true      |  true   | EXIT_FLOW         |
 *  +----+----------------+-------------+--------------+---------+-------------------+
 *
 *  Note:
 *        - Scenario 0 is a new user flow
 *        - Scenarios 1 to 7 are not possible be cause we do not have a wallet connected
 *        - Scenario 11 is returning user who for some reason does not have a session (new browser, cleared cache, etc.)
 *        - Scenario 13 is returning user who has revoked allowance
 *        - Scenario 15 is a fully setup returning user, exits immediately without showing any UI
 *        - hasAllowance = allowance > 100 tokens
 *        - DONE state is reached only through normal flow (SPAWN_AND_SESSION__LOADING → DONE)
 */

export type FlowContext = {
  walletConnected: boolean
  sessionReady: boolean
  hasAllowance: boolean
  isSpawned: boolean
}

/**
 * Determines the next state based on current flow context.
 * This is the single source of truth for all flow transitions.
 *
 * @param context - Current state of wallet, session, allowance, and spawn status
 * @returns The appropriate next state
 */
export function determineNextState(context: FlowContext): SPAWN_STATE {
  const { walletConnected, sessionReady, hasAllowance, isSpawned } = context

  // Scenario 0-7: No wallet connected
  if (!walletConnected) {
    return SPAWN_STATE.CONNECT_WALLET
  }

  // Wallet is connected, check other conditions
  if (!sessionReady) {
    // Scenarios 8-11: No session
    if (!hasAllowance) {
      // Scenario 8 or 9
      if (!isSpawned) {
        // Scenario 8: New user, no session, no allowance, not spawned
        return SPAWN_STATE.INTRODUCTION
      } else {
        // Scenario 9: Returning user, no session, no allowance, spawned
        return SPAWN_STATE.ALLOWANCE
      }
    } else {
      // Scenario 10 or 11
      if (!isSpawned) {
        // Scenario 10: Has allowance but no session and not spawned
        return SPAWN_STATE.SESSION_AND_SPAWN
      } else {
        // Scenario 11: Has allowance, spawned, but no session (new device)
        return SPAWN_STATE.SESSION
      }
    }
  } else {
    // Scenarios 12-15: Session is ready
    if (!hasAllowance) {
      // Scenario 12 or 13: No allowance (regardless of spawn status)
      return SPAWN_STATE.ALLOWANCE
    } else {
      // Scenario 14 or 15
      if (!isSpawned) {
        // Scenario 14: Has everything except spawn
        return SPAWN_STATE.SPAWN
      } else {
        // Scenario 15: Fully setup, exit flow
        return SPAWN_STATE.EXIT_FLOW
      }
    }
  }
}

// Export singleton instance instead of factory function
export const spawnState = {
  state: {
    reset: resetSpawnState,
    set: setSpawnState,
    transitionTo,
    setOnExitFlow,
    get current() {
      return spawnStateValue
    }
  },
  data: {
    setPlayerName,
    get playerName() {
      return playerName
    }
  }
}
