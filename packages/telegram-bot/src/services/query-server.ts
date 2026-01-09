import ky from "ky"
import type { Address } from "viem"
import { getEnv } from "../utils/env.js"

// Response types matching query-server
export interface ItemResponse {
  id: string
  name: string | null
  value: string | null
}

export interface PlayerResponse {
  id: string
  name: string | null
  currentRat: string | null
  pastRats: string[]
  creationBlock: string | null
  masterKey: boolean
}

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
  challengeTrip: boolean
  fixedMinValueToEnter: string | null
  overrideMaxValuePerWinPercentage: string | null
  challengeWinner: string | null
}

export interface HydrationResponse {
  blockNumber: string
  player: PlayerResponse
  currentRat: RatResponse | null
  items: ItemResponse[]
}

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

export interface GlobalConfigsResponse {
  blockNumber: string
  gameConfig: GameConfigResponse
  gamePercentagesConfig: GamePercentagesConfigResponse
  externalAddressesConfig: {
    erc20Address: string | null
    gamePoolAddress: string | null
    mainSaleAddress: string | null
    serviceAddress: string | null
    feeAddress: string | null
  }
}

export interface TripsEndpointResponse {
  blockNumber: string
  trips: TripResponse[]
}

export interface AvailableTripsResponse extends TripsEndpointResponse {
  pagination: {
    limit: number
    offset: number
    total: number
    hasMore: boolean
  }
}

export interface RatLeaderboardEntry {
  id: string
  name: string | null
  balance: string
  inventoryValue: string
  totalValue: string
  dead: boolean
  liquidated: boolean
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

export interface LeaderboardResponse<T> {
  entries: T[]
  limit: number
}

/**
 * Convert wallet address to MUD entity ID (bytes32)
 */
export function addressToEntityId(address: Address): string {
  return `0x000000000000000000000000${address.slice(2).toLowerCase()}`
}

/**
 * Query server API client
 */
class QueryServerClient {
  private client: typeof ky

  constructor() {
    const env = getEnv()
    this.client = ky.create({
      prefixUrl: env.QUERY_SERVER_URL,
      timeout: 10000,
      headers: {
        "Cache-Control": "no-store"
      }
    })
  }

  /**
   * Get game configuration
   */
  async getConfig(): Promise<GlobalConfigsResponse> {
    return this.client.get("api/config").json<GlobalConfigsResponse>()
  }

  /**
   * Get player data by wallet address
   */
  async getPlayer(walletAddress: Address): Promise<PlayerResponse | null> {
    const entityId = addressToEntityId(walletAddress)
    try {
      return await this.client.get(`api/player/${entityId}`).json<PlayerResponse>()
    } catch {
      return null
    }
  }

  /**
   * Get player hydration data (player + rat + inventory)
   */
  async getHydration(walletAddress: Address): Promise<HydrationResponse | null> {
    const entityId = addressToEntityId(walletAddress)
    try {
      return await this.client.get(`api/hydration/${entityId}`).json<HydrationResponse>()
    } catch {
      return null
    }
  }

  /**
   * Get rat data by ID
   */
  async getRat(ratId: string): Promise<RatResponse | null> {
    try {
      return await this.client.get(`api/rat/${ratId}`).json<RatResponse>()
    } catch {
      return null
    }
  }

  /**
   * Get trip data by ID
   */
  async getTrip(tripId: string): Promise<TripResponse | null> {
    try {
      return await this.client.get(`api/trip/${tripId}`).json<TripResponse>()
    } catch {
      return null
    }
  }

  /**
   * Get trips for a player (with balance > 0 or owned by player)
   */
  async getTripsForPlayer(walletAddress: Address): Promise<TripsEndpointResponse> {
    const entityId = addressToEntityId(walletAddress)
    return this.client.get(`api/trips/${entityId}`).json<TripsEndpointResponse>()
  }

  /**
   * Get all available trips (balance > 0, not liquidated)
   */
  async getAvailableTrips(options?: {
    limit?: number
    offset?: number
    sortBy?: "balance" | "visitCount" | "killCount" | "creationBlock"
    sortOrder?: "asc" | "desc"
  }): Promise<AvailableTripsResponse> {
    const searchParams = new URLSearchParams()
    if (options?.limit) searchParams.set("limit", options.limit.toString())
    if (options?.offset) searchParams.set("offset", options.offset.toString())
    if (options?.sortBy) searchParams.set("sortBy", options.sortBy)
    if (options?.sortOrder) searchParams.set("sortOrder", options.sortOrder)

    const queryString = searchParams.toString()
    const url = queryString ? `api/trips/available?${queryString}` : "api/trips/available"
    return this.client.get(url).json<AvailableTripsResponse>()
  }

  /**
   * Get active rats leaderboard
   */
  async getActiveRatsLeaderboard(): Promise<LeaderboardResponse<RatLeaderboardEntry>> {
    return this.client.get("api/leaderboard/active-rats").json<LeaderboardResponse<RatLeaderboardEntry>>()
  }

  /**
   * Get active trips leaderboard
   */
  async getActiveTripsLeaderboard(): Promise<LeaderboardResponse<TripLeaderboardEntry>> {
    return this.client.get("api/leaderboard/active-trips").json<LeaderboardResponse<TripLeaderboardEntry>>()
  }
}

// Singleton instance
let client: QueryServerClient | null = null

export function getQueryServerClient(): QueryServerClient {
  if (!client) {
    client = new QueryServerClient()
  }
  return client
}
