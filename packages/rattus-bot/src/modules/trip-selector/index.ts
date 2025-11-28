import Anthropic from "@anthropic-ai/sdk"
import type { Trip, Rat, Config, TripOutcomeHistory, TripSelectionResult } from "../../types"
import { selectTripHeuristic, selectTripRandom } from "./heuristic"
import { selectTripWithClaude } from "./claude"
import { selectTripHistorical } from "./historical"

export type TripSelector = "claude" | "heuristic" | "random" | "historical"

export interface SelectTripOptions {
  config: Config
  trips: Trip[]
  rat: Rat
  anthropic?: Anthropic
  outcomeHistory?: TripOutcomeHistory[]
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
  outcomeHistory?: TripOutcomeHistory[],
  worldAddress?: string
): Promise<TripSelectionResult | null>
export async function selectTrip(
  configOrOptions: Config | SelectTripOptions,
  trips?: Trip[],
  rat?: Rat,
  anthropic?: Anthropic,
  outcomeHistory: TripOutcomeHistory[] = [],
  worldAddress?: string
): Promise<TripSelectionResult | null> {
  // Handle both overloads
  let config: Config
  let tripsArray: Trip[]
  let ratObj: Rat
  let anthropicClient: Anthropic | undefined
  let history: TripOutcomeHistory[]
  let worldAddr: string | undefined

  if ("config" in configOrOptions) {
    // Options object overload
    config = configOrOptions.config
    tripsArray = configOrOptions.trips
    ratObj = configOrOptions.rat
    anthropicClient = configOrOptions.anthropic
    history = configOrOptions.outcomeHistory ?? []
    worldAddr = configOrOptions.worldAddress
  } else {
    // Legacy positional arguments
    config = configOrOptions
    tripsArray = trips!
    ratObj = rat!
    anthropicClient = anthropic
    history = outcomeHistory
    worldAddr = worldAddress
  }

  if (tripsArray.length === 0) {
    return null
  }

  if (config.tripSelector === "claude" && anthropicClient) {
    console.log("Using Claude AI to select trip...")
    return selectTripWithClaude(anthropicClient, tripsArray, ratObj, history)
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
    return selectTripHistorical(tripsArray, worldAddr)
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
export { selectTripWithClaude } from "./claude"
export { selectTripHistorical } from "./historical"
