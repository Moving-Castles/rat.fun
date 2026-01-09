import { createClient, type SanityClient } from "@sanity/client"
import { getEnv } from "../utils/env.js"

// Outcome types from Sanity CMS
export interface OutcomeLogEntry {
  event: string
  timestamp: string
}

export interface OutcomeItemChange {
  type: "add" | "remove"
  name: string
  value: number
}

export interface OutcomeResponse {
  _id: string
  _createdAt: string
  tripId: string
  ratId: string
  ratName: string
  playerName: string
  ratValueChange: number
  tripValueChange: number
  oldRatBalance: number
  newRatBalance: number
  readableLog?: string
  itemsGained?: OutcomeItemChange[]
  itemsLost?: OutcomeItemChange[]
}

export interface TripImageResponse {
  imageUrl: string | null
}

// GROQ queries
const QUERIES = {
  // Get outcomes for a specific rat (for /history command)
  outcomesForRat: `
    *[_type == "outcome" && ratId == $ratId] | order(_createdAt desc) [0...10] {
      _id,
      _createdAt,
      tripId,
      ratValueChange,
      newRatBalance,
      "readableLog": array::join(log[].event, " | "),
      "itemsGained": itemChanges[type == "add"]{name, value},
      "itemsLost": itemChanges[type == "remove"]{name, value}
    }
  `,

  // Get recent outcomes across all players (for activity feed)
  recentOutcomes: `
    *[_type == "outcome"] | order(_createdAt desc) [0...20] {
      _id,
      _createdAt,
      playerName,
      ratName,
      ratValueChange,
      tripId
    }
  `,

  // Get trip image URL
  tripImage: `
    *[_type == "trip" && _id == $tripId][0] {
      "imageUrl": image.asset->url
    }
  `,

  // Get trip with full details
  trip: `
    *[_type == "trip" && _id == $tripId][0] {
      _id,
      title,
      prompt,
      owner,
      ownerName,
      creationCost,
      "imageUrl": image.asset->url,
      challenge
    }
  `
}

/**
 * Sanity CMS client for GROQ queries
 */
class SanityQueryClient {
  private client: SanityClient

  constructor() {
    const env = getEnv()
    this.client = createClient({
      projectId: env.SANITY_PROJECT_ID,
      dataset: env.SANITY_DATASET,
      useCdn: true, // Use CDN for read-only queries
      apiVersion: "2024-01-01"
    })
  }

  /**
   * Get outcome history for a specific rat
   */
  async getOutcomesForRat(ratId: string): Promise<OutcomeResponse[]> {
    return this.client.fetch<OutcomeResponse[]>(QUERIES.outcomesForRat, { ratId })
  }

  /**
   * Get recent outcomes across all players
   */
  async getRecentOutcomes(): Promise<OutcomeResponse[]> {
    return this.client.fetch<OutcomeResponse[]>(QUERIES.recentOutcomes)
  }

  /**
   * Get trip image URL
   */
  async getTripImage(tripId: string): Promise<string | null> {
    const result = await this.client.fetch<TripImageResponse | null>(QUERIES.tripImage, { tripId })
    return result?.imageUrl ?? null
  }

  /**
   * Get trip details from CMS
   */
  async getTrip(tripId: string): Promise<{
    _id: string
    title: string
    prompt: string
    owner: string
    ownerName: string
    creationCost: number
    imageUrl: string | null
    challenge: boolean
  } | null> {
    return this.client.fetch(QUERIES.trip, { tripId })
  }
}

// Singleton instance
let client: SanityQueryClient | null = null

export function getSanityClient(): SanityQueryClient {
  if (!client) {
    client = new SanityQueryClient()
  }
  return client
}

/**
 * Format outcome history for Telegram display
 */
export function formatOutcomeHistory(outcomes: OutcomeResponse[]): string {
  if (outcomes.length === 0) {
    return "No trip history found."
  }

  const lines: string[] = ["📜 TRIP HISTORY", "━━━━━━━━━━━━━━━━━━━", ""]

  for (const outcome of outcomes) {
    const date = new Date(outcome._createdAt)
    const dateStr = date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
    const sign = outcome.ratValueChange >= 0 ? "+" : ""

    lines.push(`${dateStr}: ${sign}${outcome.ratValueChange} tokens`)

    // Add item changes if any
    if (outcome.itemsGained && outcome.itemsGained.length > 0) {
      for (const item of outcome.itemsGained) {
        lines.push(`  +${item.name}`)
      }
    }
    if (outcome.itemsLost && outcome.itemsLost.length > 0) {
      for (const item of outcome.itemsLost) {
        lines.push(`  -${item.name}`)
      }
    }

    lines.push("")
  }

  return lines.join("\n")
}
