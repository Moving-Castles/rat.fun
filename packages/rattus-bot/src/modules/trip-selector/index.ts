import Anthropic from "@anthropic-ai/sdk"
import type { Trip, Rat, Config, TripOutcomeHistory, TripSelectionResult } from "../../types"
import { selectTripHeuristic } from "./heuristic"
import { selectTripWithClaude } from "./claude"

export type TripSelector = "claude" | "heuristic"

/**
 * Select a trip based on the configured strategy
 */
export async function selectTrip(
  config: Config,
  trips: Trip[],
  rat: Rat,
  anthropic?: Anthropic,
  outcomeHistory: TripOutcomeHistory[] = []
): Promise<TripSelectionResult | null> {
  if (trips.length === 0) {
    return null
  }

  if (config.tripSelector === "claude" && anthropic) {
    console.log("Using Claude AI to select trip...")
    return selectTripWithClaude(anthropic, trips, rat, outcomeHistory)
  } else {
    console.log("Using heuristic (highest balance) to select trip...")
    const trip = selectTripHeuristic(trips)
    if (!trip) return null
    return {
      trip,
      explanation: "Selected trip with highest balance"
    }
  }
}

export { selectTripHeuristic } from "./heuristic"
export { selectTripWithClaude } from "./claude"
