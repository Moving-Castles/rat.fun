/**
 * API response types for query-server endpoints
 */

// Item response (psycho-object)
export interface ItemResponse {
  id: string
  name: string | null
  value: string | null
}

// Player response
export interface PlayerResponse {
  id: string
  name: string | null
  balance: string | null
  currentRat: string | null
  pastRats: string[]
  creationBlock: string | null
  masterKey: boolean
}

// Rat response
export interface RatResponse {
  id: string
  name: string | null
  index: string | null
  balance: string | null
  owner: string | null
  dead: boolean
  inventory: ItemResponse[]
  creationBlock: string | null
  tripCount: string | null
  liquidated: boolean
  liquidationValue: string | null
  liquidationBlock: string | null
  totalValue: string | null
}

// Trip response
export interface TripResponse {
  id: string
  name: string | null
  owner: string | null
  index: string | null
  balance: string | null
  prompt: string | null
  visitCount: string | null
  killCount: string | null
  creationBlock: string | null
  lastVisitBlock: string | null
  tripCreationCost: string | null
  liquidated: boolean
  liquidationValue: string | null
  liquidationBlock: string | null
}

// Minimal player info for other players in hydration
export interface OtherPlayer {
  id: string
  name: string | null
}

// Hydration response (filtered data for a specific player)
export interface HydrationResponse {
  blockNumber: string
  player: PlayerResponse
  currentRat: RatResponse | null
  trips: TripResponse[]
  items: ItemResponse[]
  otherPlayers: OtherPlayer[]
}

// Leaderboard entry types
export interface RatLeaderboardEntry {
  id: string
  name: string | null
  balance: string
  inventoryValue: string
  totalValue: string
  dead: boolean
  liquidated: boolean
  owner: string | null
}

export interface TripLeaderboardEntry {
  id: string
  name: string | null
  balance: string
  owner: string | null
  liquidated: boolean
}

export interface RatsKilledEntry {
  id: string
  name: string | null
  ratsKilled: number
}

// Leaderboard response wrapper
export interface LeaderboardResponse<T> {
  entries: T[]
  limit: number
}
