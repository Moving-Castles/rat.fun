import { TableRecord } from "@latticexyz/store-sync"
import mudConfig from "contracts/mud.config"
import { Hex } from "viem"

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
}

export type Level = {
  id: string
  name: string
  prompt: string
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

export type GameConfig = TableRecord<
  typeof mudConfig.tables.ratroom__GameConfig
>["fields"]

export type EnterRoomData = {
  gameConfig: GameConfig
  rat: Rat
  level: Level
  player?: Player
  room?: Room
}

export type CreateRoomData = {
  gameConfig: GameConfig
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
}

/**
 * API Types
 */

export type EnterRoomBody = {
  signature: string
  roomId: string
  ratId: string
}

export type CreateRoomBody = {
  signature: string
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
export type DatabaseSchema = {
  messages: OffChainMessage[]
}

export interface WebSocketInterface {
  send: (data: string) => void
}
