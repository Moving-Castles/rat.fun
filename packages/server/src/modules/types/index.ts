import type { Hex } from "viem"
import { TableRecord } from "@latticexyz/store-sync"
// import mudConfig from "contracts/mud.config"
import mudConfig from "../../../../contracts/mud.config"

/*
 * ─────────────────────────────────────────────
 * Onchain entities
 * ─────────────────────────────────────────────
 */

export type Trip = {
  id: string
  index: number
  prompt: string
  balance: number
  tripCreationCost: number
}

export type Rat = {
  id: string
  name: string
  tripCount: number
  balance: number
  inventory: Item[]
  dead: boolean
  owner: string
  totalValue: number
}

export type Player = {
  id: string
  name: string
  balance: number
  masterKey?: boolean
}

export type Item = {
  id: string
  name: string
  value: number
}

type mudSchemas = {
  [table in keyof typeof mudConfig.namespaces.ratfun.tables]: TableRecord<
    (typeof mudConfig.namespaces.ratfun.tables)[table]
  >["fields"]
}
export type GameConfig = mudSchemas["GameConfig"]
export type GamePercentagesConfig = mudSchemas["GamePercentagesConfig"]
export type WorldEvent = mudSchemas["WorldEvent"]

/*
 * ─────────────────────────────────────────────
 * Onchain data objects
 * ─────────────────────────────────────────────
 * Returned from the MUD get data functions
 */

export type EnterTripData = {
  gameConfig: GameConfig
  gamePercentagesConfig: GamePercentagesConfig
  rat: Rat
  worldEvent: WorldEvent | undefined
  player?: Player
  trip?: Trip
}

export type CreateTripData = {
  gameConfig: GameConfig
  player: Player
}

/*
 * ─────────────────────────────────────────────
 * LLM Return values: Event and correction
 * ─────────────────────────────────────────────
 */

export type EventsReturnValue = {
  log: LogEntry[]
  outcome: OutcomeReturnValue
}

export type CorrectionReturnValue = {
  log: LogEntry[]
}

export type OutcomeReturnValue = {
  id?: string
  itemChanges: ItemChange[]
  balanceTransfers: BalanceTransfer[]
  debuggingInfo?: DebuggingInfo
}

export type ItemChange = {
  logStep: number
  type: "add" | "remove"
  name: string
  value: number
  id?: string // Is only set if type == "remove"
}

export type BalanceTransfer = {
  logStep: number
  amount: number
}

export type LogEntry = {
  timestamp: string
  event: string
}

export type DebuggingInfo = {
  internalText: string
  randomSeed: number
  batchId: number
}

/*
 * ─────────────────────────────────────────────
 * Return values to client
 * ─────────────────────────────────────────────
 */

export type EnterTripReturnValue = OutcomeReturnValue & {
  ratDead: boolean
  tripDepleted: boolean
  log: LogEntry[]
}

export type CreateTripReturnValue = {
  success: boolean
  tripId: string
}

/*
 * ─────────────────────────────────────────────
 * Fastify request body types
 * ─────────────────────────────────────────────
 */

export type EnterTripRequestBody = {
  tripId: string
  ratId: string
}

export type CreateTripRequestBody = {
  tripPrompt: string
  tripCreationCost: number
  folderId: string
}

/*
 * ─────────────────────────────────────────────
 * API Types
 * ─────────────────────────────────────────────
 */

export type SignedRequestInfo = {
  /**
   * Helps prevent replay attacks using a stale signature.
   * Also allows the server to not store old nonces permanently.
   */
  timestamp: number
  /**
   * Prevents short-term replay attacks within the timestamp window.
   */
  nonce: number
  /**
   * Delegator address, if signing was delegated to a session wallet.
   * Reuses MUD's delegation and `callFrom` logic.
   */
  calledFrom: Hex | null
}

export type SignedRequest<T> = {
  data: T
  info: SignedRequestInfo
  signature: Hex
}
