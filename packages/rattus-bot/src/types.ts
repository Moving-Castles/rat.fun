import type { Hex } from "viem"

export interface Config {
  privateKey: Hex
  anthropicApiKey: string
  chainId: number
  serverUrl: string
  tripSelector: "claude" | "heuristic" | "random" | "historical"
  autoRespawn: boolean
  ratName: string
  worldAddress?: string
  rpcHttpUrl?: string
  liquidateAtValue?: number // Liquidate rat when total value reaches this threshold
  liquidateBelowValue?: number // Liquidate rat when total value falls below this threshold
}

export interface Trip {
  id: string
  prompt: string
  balance: number
  tripCreationCost: number
  owner: string
  visitCount: number
  killCount: number
}

export interface Rat {
  id: string
  name: string
  balance: number
  dead: boolean
  owner: string
  tripCount: number
  inventory: string[]
}

export interface Player {
  id: string
  name: string
  balance: number
  currentRat: string | null
}

export interface GameConfig {
  ratCreationCost: number
  adminId: string
}

export interface GamePercentagesConfig {
  maxValuePerWin: number
  minRatValueToEnter: number
}

export interface EnterTripRequestBody {
  tripId: string
  ratId: string
}

export interface SignedRequestInfo {
  timestamp: number
  nonce: number
  calledFrom: Hex | null
}

export interface SignedRequest<T> {
  data: T
  info: SignedRequestInfo
  signature: Hex
}

export interface LogEntry {
  timestamp: string
  event: string
}

export interface EnterTripReturnValue {
  id: Hex
  log: LogEntry[]
  itemChanges: unknown[]
  balanceTransfers: unknown[]
  debuggingInfo: unknown
  ratDead: boolean
  tripDepleted: boolean
}

export interface TripOutcomeHistory {
  tripId: string
  tripPrompt: string
  totalValueBefore: number
  totalValueAfter: number
  valueChange: number
  died: boolean
  logSummary: string
}

export interface TripSelectionResult {
  trip: Trip
  explanation: string
}
