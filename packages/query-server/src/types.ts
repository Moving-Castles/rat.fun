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

// Hydration response (core player data only - trips and players fetched separately)
export interface HydrationResponse {
  blockNumber: string
  player: PlayerResponse
  currentRat: RatResponse | null
  items: ItemResponse[]
}

// Players endpoint response
export interface PlayersEndpointResponse {
  blockNumber: string
  players: OtherPlayer[]
}

// Trips endpoint response
export interface TripsEndpointResponse {
  blockNumber: string
  trips: TripResponse[]
}

// Global config types (singleton tables - stored at key 0x0...0)
export interface GameConfigResponse {
  adminAddress: string | null
  adminId: string | null
  ratCreationCost: string | null
  maxInventorySize: number | null
  maxTripPromptLength: number | null
  cooldownCloseTrip: number | null
  ratsKilledForAdminAccess: number | null
}

export interface GamePercentagesConfigResponse {
  maxValuePerWin: number | null
  minRatValueToEnter: number | null
  taxationLiquidateRat: number | null
  taxationCloseTrip: number | null
}

export interface WorldStatsResponse {
  globalTripIndex: string | null
  globalRatIndex: string | null
  globalRatKillCount: string | null
  lastKilledRatBlock: string | null
}

// Standalone world-stats endpoint response
export interface WorldStatsEndpointResponse extends WorldStatsResponse {
  blockNumber: string
}

export interface ExternalAddressesConfigResponse {
  erc20Address: string | null
  gamePoolAddress: string | null
  mainSaleAddress: string | null
  serviceAddress: string | null
  feeAddress: string | null
}

// Combined global configs for hydration (static config only, worldStats is separate)
export interface GlobalConfigsResponse {
  blockNumber: string
  gameConfig: GameConfigResponse
  gamePercentagesConfig: GamePercentagesConfigResponse
  externalAddressesConfig: ExternalAddressesConfigResponse
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
  liquidationValue: string | null
  liquidationBlock: string | null
  owner: string | null
  ownerName: string | null
}

export interface TripLeaderboardEntry {
  id: string
  prompt: string | null
  balance: string
  owner: string | null
  ownerName: string | null
  liquidated: boolean
  killCount: string
  visitCount: string
  tripCreationCost: string
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
