import ky from "ky"
import { signRequest, type SignedRequest } from "./signature.js"
import { getEnv } from "../utils/env.js"

// Request/Response types for trip/enter
export interface TripEnterRequest {
  tripId: string
  ratId: string
}

export interface TripEnterLogEntry {
  timestamp: string
  event: string
}

export interface TripEnterItemChange {
  logStep: number
  type: "add" | "remove"
  id?: string
  name: string
  value: number
}

export interface TripEnterBalanceTransfer {
  logStep: number
  amount: number
}

export interface TripEnterResponse {
  log: TripEnterLogEntry[]
  itemChanges: TripEnterItemChange[]
  balanceTransfers: TripEnterBalanceTransfer[]
  ratDead: boolean
  tripDepleted: boolean
}

export interface TripEnterError {
  error: string
}

/**
 * Game server API client
 */
class GameServerClient {
  private client: typeof ky

  constructor() {
    const env = getEnv()
    this.client = ky.create({
      prefixUrl: env.GAME_SERVER_URL,
      timeout: 60000, // Trip entry can take up to 45s due to LLM processing
      headers: {
        "Content-Type": "application/json"
      }
    })
  }

  /**
   * Enter a trip with the user's rat
   * This is the main gameplay action
   */
  async enterTrip(
    telegramUserId: number,
    tripId: string,
    ratId: string
  ): Promise<TripEnterResponse> {
    const requestData: TripEnterRequest = { tripId, ratId }
    const signedRequest = await signRequest(telegramUserId, requestData)

    const response = await this.client.post("trip/enter", {
      json: signedRequest
    })

    if (!response.ok) {
      const errorData = await response.json<TripEnterError>()
      throw new Error(errorData.error || "Trip entry failed")
    }

    return response.json<TripEnterResponse>()
  }
}

// Singleton instance
let client: GameServerClient | null = null

export function getGameServerClient(): GameServerClient {
  if (!client) {
    client = new GameServerClient()
  }
  return client
}

/**
 * Format trip outcome for display in Telegram
 */
export function formatTripOutcome(outcome: TripEnterResponse): string {
  const lines: string[] = []

  // Add log entries
  if (outcome.log.length > 0) {
    lines.push("📜 STORY")
    lines.push("━━━━━━━━━━━━━━━━━━━")
    for (const entry of outcome.log) {
      lines.push(entry.event)
    }
    lines.push("")
  }

  // Add results summary
  lines.push("📊 RESULTS")
  lines.push("━━━━━━━━━━━━━━━━━━━")

  // Balance changes
  const totalBalanceChange = outcome.balanceTransfers.reduce((sum, t) => sum + t.amount, 0)
  if (totalBalanceChange !== 0) {
    const sign = totalBalanceChange > 0 ? "+" : ""
    lines.push(`  ${sign}${totalBalanceChange} tokens`)
  }

  // Item changes
  const itemsGained = outcome.itemChanges.filter(c => c.type === "add")
  const itemsLost = outcome.itemChanges.filter(c => c.type === "remove")

  for (const item of itemsGained) {
    lines.push(`  +1 item: ${item.name} (${item.value})`)
  }
  for (const item of itemsLost) {
    lines.push(`  -1 item: ${item.name} (${item.value})`)
  }

  // Death/depletion status
  if (outcome.ratDead) {
    lines.push("")
    lines.push("💀 Your rat has died!")
  }
  if (outcome.tripDepleted) {
    lines.push("")
    lines.push("🏆 Trip depleted!")
  }

  return lines.join("\n")
}
