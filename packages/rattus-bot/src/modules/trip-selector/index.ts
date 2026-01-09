import Anthropic from "@anthropic-ai/sdk"
import type { Trip, Rat, Config, TripOutcomeHistory, TripSelectionResult } from "../../types"
import { selectTripHeuristic, selectTripRandom } from "./heuristic"
import { selectTripWithClaude } from "./claude"
import { selectTripHistorical } from "./historical"
import { selectTripWithGraph } from "./graph"
import type { GraphStrategyConfig } from "./graph"

export type TripSelector = "claude" | "heuristic" | "random" | "historical" | "graph"

export interface SelectTripOptions {
  config: Config
  trips: Trip[]
  rat: Rat
  ratTotalValue?: number
  anthropic?: Anthropic
  outcomeHistory?: TripOutcomeHistory[]
  worldAddress?: string
  minRatValueToEnterPercent?: number
  graphConfig?: Partial<GraphStrategyConfig>
  currentPath?: string[] // Trip IDs taken this session (for graph strategy)
  inventory?: string[] // Item names rat currently has (for graph strategy)
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
  let ratTotalValue: number | undefined
  let minRatValueToEnterPercent: number | undefined
  let graphConfig: Partial<GraphStrategyConfig> | undefined
  let currentPath: string[] | undefined
  let inventory: string[] | undefined

  if ("config" in configOrOptions) {
    // Options object overload
    config = configOrOptions.config
    tripsArray = configOrOptions.trips
    ratObj = configOrOptions.rat
    anthropicClient = configOrOptions.anthropic
    history = configOrOptions.outcomeHistory ?? []
    worldAddr = configOrOptions.worldAddress
    ratTotalValue = configOrOptions.ratTotalValue
    minRatValueToEnterPercent = configOrOptions.minRatValueToEnterPercent
    graphConfig = configOrOptions.graphConfig
    currentPath = configOrOptions.currentPath
    inventory = configOrOptions.inventory
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
  } else if (config.tripSelector === "graph" && worldAddr) {
    console.log("Using graph-based pathfinding to select trip...")
    return selectTripWithGraph({
      trips: tripsArray,
      rat: ratObj,
      ratTotalValue: ratTotalValue ?? ratObj.balance,
      worldAddress: worldAddr,
      minRatValueToEnterPercent,
      config: graphConfig,
      currentPath,
      inventory
    })
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
export {
  selectTripWithGraph,
  initializeGraph,
  updateGraphWithOutcome,
  markTripDepleted,
  getGraph,
  addTripToGraph,
  rebuildGraph,
  getRecommendedPath
} from "./graph"
export type { GraphStrategyConfig, ExtendedOutcome } from "./graph"
