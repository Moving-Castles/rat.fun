import type { Hex } from "viem"
import { TableRecord } from "@latticexyz/store-sync"
import mudConfig from "../../../../contracts/mud.config"

export type Room = {
  id: string
  level: string
  prompt: string
  balance: number
  index: number
}

export type Rat = {
  id: string
  name: string
  level: string
  balance: number
  traits: Trait[]
  inventory: Item[]
  dead: boolean
  owner: string
  stats: {
    health: number
  }
}

export type Player = {
  id: string
  name: string
  balance: number
  visitedLevels: string[]
  masterKey: boolean
}

export type Level = {
  id: string
  index: number
  minBalance: number
  maxBalance: number
  roomCreationCost: number
}

export type MinimalLevel = Pick<Level, "id" | "roomCreationCost">

export type Trait = {
  id: string
  name: string
  value: number
}

export type Item = {
  id: string
  name: string
  value: number
}

export type GameConfig = TableRecord<typeof mudConfig.tables.ratroom__GameConfig>["fields"]

export type EnterRoomData = {
  gameConfig: GameConfig
  worldPrompt: string
  rat: Rat
  level: Level
  player?: Player
  room?: Room
}

export type CreateRoomData = {
  gameConfig: GameConfig
  worldPrompt: string
  level: MinimalLevel
  player: Player
}

export type TraitChange = {
  logStep: number
  type: "add" | "remove"
  name: string
  value: number
  id?: string // Is only set if type == "remove"
}

export type ItemChange = {
  logStep: number
  type: "add" | "remove"
  name: string
  value: number
  id?: string // Is only set if type == "remove"
}

export type HealthChange = {
  logStep: number
  amount: number
}

export type BalanceTransfer = {
  logStep: number
  amount: number
}

export type LogEntry = {
  timestamp: string
  event: string
}

export type OutcomeReturnValue = {
  id?: string
  outcomeId: string
  traitChanges: TraitChange[]
  itemChanges: ItemChange[]
  healthChange: HealthChange
  balanceTransfer: BalanceTransfer
}

/**
 * LLM Return values
 */

export type EventsReturnValue = {
  log: LogEntry[]
  outcome: OutcomeReturnValue
}

export type CorrectionReturnValue = {
  log: LogEntry[]
}

/**
 * Return value for the EnterRoom function
 */

export type EnterRoomReturnValue = OutcomeReturnValue & {
  ratDead: boolean
  roomDepleted: boolean
  levelUp: boolean
  levelDown: boolean
  log: LogEntry[]
}

/**
 * API Types
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

export type EnterRoomRequestBody = {
  roomId: string
  ratId: string
}

export type CreateRoomRequestBody = {
  roomPrompt: string
  levelId: string
}

export type CreateRoomReturnValue = {
  success: boolean
  roomId: string
}

/**
 * WebSocket Types
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
  level: string
  playerName?: string
  ratName?: string
  ratId?: string
  roomIndex?: number
  roomId?: string
  message?: string | string[]
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
