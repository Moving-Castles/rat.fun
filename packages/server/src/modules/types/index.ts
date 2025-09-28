import type { Hex } from "viem"
import { TableRecord } from "@latticexyz/store-sync"
import mudConfig from "../../../../contracts/mud.config"

/*
 * ─────────────────────────────────────────────
 * Onchain entities
 * ─────────────────────────────────────────────
 */

export type Room = {
  id: string
  index: number
  prompt: string
  balance: number
  roomCreationCost: number
}

export type Rat = {
  id: string
  name: string
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

export type EnterRoomData = {
  gameConfig: GameConfig
  gamePercentagesConfig: GamePercentagesConfig
  rat: Rat
  worldEvent: WorldEvent | undefined
  player?: Player
  room?: Room
}

export type CreateRoomData = {
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
  outcomeId: string
  itemChanges: ItemChange[]
  balanceTransfers: BalanceTransfer[]
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

/*
 * ─────────────────────────────────────────────
 * Return values to client
 * ─────────────────────────────────────────────
 */

export type EnterRoomReturnValue = OutcomeReturnValue & {
  ratDead: boolean
  roomDepleted: boolean
  log: LogEntry[]
}

export type CreateRoomReturnValue = {
  success: boolean
  roomId: string
}

/*
 * ─────────────────────────────────────────────
 * Fastify request body types
 * ─────────────────────────────────────────────
 */

export type EnterRoomRequestBody = {
  roomId: string
  ratId: string
}

export type CreateRoomRequestBody = {
  roomPrompt: string
  roomCreationCost: number
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

/*
 * ─────────────────────────────────────────────
 * WebSocket Types
 * ─────────────────────────────────────────────
 */

export interface WebSocketParams {
  Params: {
    playerId: string
  }
}

export type OffChainMessage = {
  id: string
  topic:
    | "test"
    | "clients__update"
    | "chat__message"
    | "key__activation"
    | "room__creation"
    | "room__outcome"
    | "room__liquidation"
    | "rat__deploy"
    | "rat__death"
    | "rat__liquidate"
  playerName?: string
  ratName?: string
  ratId?: string
  roomIndex?: number
  roomId?: string
  message?: string | string[]
  outcome?: OutcomeReturnValue
  timestamp: number
  signature?: string
}

// For the message store
export type MessageDatabaseSchema = {
  messages: OffChainMessage[]
}

export type NonceDatabaseSchema = {
  nonces: Record<number, boolean>
}

export interface WebSocketInterface {
  send: (data: string) => void
}

/*
 * ─────────────────────────────────────────────
 * CMS Types
 * ─────────────────────────────────────────────
 */

import type { TemplateImages } from "@sanity-public-cms-types"

export type ResolvedTemplateImages = Omit<TemplateImages, "roomImages"> & {
  roomImages?: string[]
}
