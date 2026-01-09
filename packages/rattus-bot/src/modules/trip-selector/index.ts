import Anthropic from "@anthropic-ai/sdk"
import type { Trip, Rat, Config, TripSelectionResult } from "../../types"
import { selectTripHeuristic, selectTripRandom } from "./heuristic"
import { selectTripWithClaude, type InventoryItem } from "./claude"
import { selectTripHistorical } from "./historical"
import { getRecentOutcomes } from "../cms"

export type TripSelector = "claude" | "heuristic" | "random" | "historical"

export interface SelectTripOptions {
  config: Config
  trips: Trip[]
  rat: Rat
  anthropic?: Anthropic
  inventoryDetails?: InventoryItem[]
  worldAddress?: string
}

/**
 * Select a trip based on the configured strategy
 */
export async function selectTrip(options: SelectTripOptions): Promise<TripSelectionResult | null>
/**
 * @deprecated Use the options object overload instead
 */
export async function selectTrip(
  config: Config,
  trips: Trip[],
  rat: Rat,
  anthropic?: Anthropic,
  inventoryDetails?: InventoryItem[],
  worldAddress?: string
): Promise<TripSelectionResult | null>
export async function selectTrip(
  configOrOptions: Config | SelectTripOptions,
  trips?: Trip[],
  rat?: Rat,
  anthropic?: Anthropic,
  inventoryDetails: InventoryItem[] = [],
  worldAddress?: string
): Promise<TripSelectionResult | null> {
  // Handle both overloads
  let config: Config
  let tripsArray: Trip[]
  let ratObj: Rat
  let anthropicClient: Anthropic | undefined
  let inventory: InventoryItem[]
  let worldAddr: string | undefined

  if ("config" in configOrOptions) {
    // Options object overload
    config = configOrOptions.config
    tripsArray = configOrOptions.trips
    ratObj = configOrOptions.rat
    anthropicClient = configOrOptions.anthropic
    inventory = configOrOptions.inventoryDetails ?? []
    worldAddr = configOrOptions.worldAddress
  } else {
    // Legacy positional arguments
    config = configOrOptions
    tripsArray = trips!
    ratObj = rat!
    anthropicClient = anthropic
    inventory = inventoryDetails
    worldAddr = worldAddress
  }

  if (tripsArray.length === 0) {
    return null
  }

  if (config.tripSelector === "claude" && anthropicClient) {
    console.log("Using Claude AI to select trip...")

    // Fetch recent outcomes from CMS for Claude to learn from
    let recentOutcomes: Awaited<ReturnType<typeof getRecentOutcomes>> = []
    if (worldAddr) {
      try {
        console.log("Fetching recent outcomes from CMS...")
        recentOutcomes = await getRecentOutcomes(worldAddr, 50)
        console.log(`Fetched ${recentOutcomes.length} recent outcomes`)
      } catch (error) {
        console.warn("Failed to fetch recent outcomes:", error)
      }
    }

    return selectTripWithClaude(anthropicClient, tripsArray, ratObj, inventory, recentOutcomes)
  } else if (config.tripSelector === "random") {
    console.log("Using random selection...")
    const trip = selectTripRandom(tripsArray)
    if (!trip) return null
    return {
      trip,
      explanation: "Selected trip randomly"
    }
  } else if (config.tripSelector === "historical" && worldAddr) {
    console.log("Using historical data from CMS to select trip...")
    return selectTripHistorical(tripsArray, worldAddr, anthropicClient, ratObj, inventory)
  } else {
    console.log("Using heuristic (highest balance) to select trip...")
    const trip = selectTripHeuristic(tripsArray)
    if (!trip) return null
    return {
      trip,
      explanation: "Selected trip with highest balance"
    }
  }
}

export { selectTripHeuristic, selectTripRandom } from "./heuristic"
export { selectTripWithClaude, type InventoryItem } from "./claude"
export { selectTripHistorical } from "./historical"
