/**
 * ========================================
 * Graph-Based Trip Selection Strategy
 * ========================================
 *
 * Simple approach: find the most profitable rat journeys and copy them.
 *
 * The graph is built once on startup from Sanity CMS data and updated
 * incrementally as new outcomes are recorded.
 */

import type { Trip, TripSelectionResult } from "../../../types"
import type { ExtendedOutcome } from "./types"
import { TripGraphBuilder, getGraphBuilder } from "./graph-builder"

// =============================================================================
// GRAPH INSTANCE MANAGEMENT
// =============================================================================

let graphBuilder: TripGraphBuilder | null = null
let graphInitPromise: Promise<void> | null = null

/**
 * Initialize or get the graph builder
 */
export async function initializeGraph(
  worldAddress: string,
  trips: Trip[],
  minRatValueToEnterPercent: number = 30
): Promise<TripGraphBuilder> {
  // Check if we already have an initialized graph for this world
  if (
    graphBuilder &&
    graphBuilder.getGraph().worldAddress === worldAddress &&
    graphBuilder.isInitialized()
  ) {
    return graphBuilder
  }

  // Check if initialization is already in progress
  if (graphInitPromise) {
    await graphInitPromise
    if (graphBuilder) return graphBuilder
  }

  // Create new graph builder
  graphBuilder = getGraphBuilder(worldAddress, minRatValueToEnterPercent)

  // Initialize asynchronously
  graphInitPromise = graphBuilder.initialize(trips)
  await graphInitPromise
  graphInitPromise = null

  return graphBuilder
}

/**
 * Get the current graph builder (must be initialized first)
 */
export function getGraph(): TripGraphBuilder | null {
  return graphBuilder
}

/**
 * Update graph with a new outcome
 */
export function updateGraphWithOutcome(tripId: string, outcome: ExtendedOutcome): void {
  if (graphBuilder) {
    graphBuilder.updateWithOutcome(tripId, outcome)
  }
}

/**
 * Mark a trip as depleted in the graph
 */
export function markTripDepleted(tripId: string): void {
  if (graphBuilder) {
    graphBuilder.markTripDepleted(tripId)
  }
}

/**
 * Add a new trip to the graph
 */
export async function addTripToGraph(trip: Trip): Promise<void> {
  if (graphBuilder) {
    await graphBuilder.addTrip(trip)
  }
}

/**
 * Rebuild the graph (call periodically for accuracy)
 */
export async function rebuildGraph(trips: Trip[]): Promise<void> {
  if (graphBuilder) {
    await graphBuilder.rebuild(trips)
  }
}

// =============================================================================
// MAIN SELECTION FUNCTION
// =============================================================================

export interface GraphSelectionOptions {
  trips: Trip[]
  rat: Rat
  ratTotalValue: number
  worldAddress: string
  minRatValueToEnterPercent?: number
  config?: Partial<GraphStrategyConfig>
  currentPath?: string[] // Trip IDs the rat has already taken this session
  inventory?: string[] // Item names the rat currently has
}

/**
 * Select the best trip using the graph-based strategy
 * Simple approach: copy the most profitable rat journey
 */
export async function selectTripWithGraph(
  options: GraphSelectionOptions
): Promise<TripSelectionResult | null> {
  const {
    trips,
    ratTotalValue,
    worldAddress,
    minRatValueToEnterPercent = 30,
    currentPath = []
  } = options

  console.log(
    `[Graph] Starting trip selection (rat value: ${ratTotalValue}, trips available: ${trips.length})`
  )

  if (trips.length === 0) {
    return null
  }

  // Build set of available trip IDs for quick lookup
  const availableTripIds = new Set(trips.map(t => t.id))

  // Ensure graph is initialized
  console.log(`[Graph] Ensuring graph is initialized...`)
  const builder = await initializeGraph(worldAddress, trips, minRatValueToEnterPercent)
  const graph = builder.getGraph()

  // Get all journeys sorted by profitability (peak value achieved)
  const journeys = [...graph.successfulJourneys].sort((a, b) => b.peakValue - a.peakValue)

  console.log(`[Graph] Found ${journeys.length} profitable journeys to learn from`)

  if (journeys.length === 0) {
    // Fallback: pick trip with highest balance
    console.log(`[Graph] No journeys found, falling back to highest balance trip`)
    const sorted = [...trips].sort((a, b) => b.balance - a.balance)
    return {
      trip: sorted[0],
      explanation: "Fallback: highest balance trip (no journey data)"
    }
  }

  // Log top 3 most profitable journeys
  console.log(`[Graph] Top profitable journeys:`)
  for (let i = 0; i < Math.min(3, journeys.length); i++) {
    const j = journeys[i]
    console.log(
      `[Graph]   ${i + 1}. ${j.ratName} - peak: ${j.peakValue}, trips: ${j.totalTrips}, gain: ${j.totalValueGained}`
    )
  }

  // Current step in journey (how many trips we've taken)
  const currentStep = currentPath.length
  console.log(
    `[Graph] Current step: ${currentStep} (path: ${currentPath.length > 0 ? currentPath.map(id => id.slice(0, 8)).join(" -> ") : "start"})`
  )

  // Try to find a journey we can follow
  for (const journey of journeys) {
    const journeyTripIds = journey.steps.map(s => s.tripId)

    // If we haven't taken any trips yet, try to start this journey
    if (currentStep === 0) {
      const firstTripId = journeyTripIds[0]
      if (availableTripIds.has(firstTripId)) {
        const trip = trips.find(t => t.id === firstTripId)!
        console.log(
          `[Graph] Following journey of "${journey.ratName}" (peak: ${journey.peakValue})`
        )
        console.log(
          `[Graph] Journey path: ${journeyTripIds.map(id => id.slice(0, 8)).join(" -> ")}`
        )
        console.log(`[Graph] Starting with trip 1/${journeyTripIds.length}`)
        return {
          trip,
          explanation: `Following ${journey.ratName}'s journey (peak: ${journey.peakValue}) - step 1/${journeyTripIds.length}`
        }
      }
      continue
    }

    // Check if our current path matches this journey's prefix
    let matchesPrefix = true
    for (let i = 0; i < currentPath.length && i < journeyTripIds.length; i++) {
      if (currentPath[i] !== journeyTripIds[i]) {
        matchesPrefix = false
        break
      }
    }

    if (matchesPrefix && currentStep < journeyTripIds.length) {
      // We're following this journey! Get the next trip
      const nextTripId = journeyTripIds[currentStep]
      if (availableTripIds.has(nextTripId)) {
        const trip = trips.find(t => t.id === nextTripId)!
        console.log(
          `[Graph] Continuing journey of "${journey.ratName}" (peak: ${journey.peakValue})`
        )
        console.log(`[Graph] Next trip: step ${currentStep + 1}/${journeyTripIds.length}`)
        return {
          trip,
          explanation: `Following ${journey.ratName}'s journey (peak: ${journey.peakValue}) - step ${currentStep + 1}/${journeyTripIds.length}`
        }
      }
    }
  }

  // No exact journey match - find any journey with an available next trip
  console.log(`[Graph] No exact journey match, looking for any profitable trip...`)

  // Collect all trips from profitable journeys and score by position
  const tripScores = new Map<string, { score: number; journeyPeak: number; journeyName: string }>()

  for (const journey of journeys) {
    for (let i = 0; i < journey.steps.length; i++) {
      const tripId = journey.steps[i].tripId
      if (!availableTripIds.has(tripId)) continue

      // Score: earlier steps in more profitable journeys are better
      const positionBonus = (journey.steps.length - i) / journey.steps.length
      const score = journey.peakValue * positionBonus

      const existing = tripScores.get(tripId)
      if (!existing || score > existing.score) {
        tripScores.set(tripId, {
          score,
          journeyPeak: journey.peakValue,
          journeyName: journey.ratName
        })
      }
    }
  }

  // Pick the best scored trip
  let bestTripId: string | null = null
  let bestScore = -Infinity
  let bestData: { journeyPeak: number; journeyName: string } | null = null

  for (const [tripId, data] of tripScores) {
    if (data.score > bestScore) {
      bestScore = data.score
      bestTripId = tripId
      bestData = data
    }
  }

  if (bestTripId && bestData) {
    const trip = trips.find(t => t.id === bestTripId)!
    console.log(
      `[Graph] Selected trip from ${bestData.journeyName}'s journey (peak: ${bestData.journeyPeak})`
    )
    return {
      trip,
      explanation: `Trip from ${bestData.journeyName}'s journey (peak: ${bestData.journeyPeak})`
    }
  }

  // Ultimate fallback
  console.log(`[Graph] No matching trips, falling back to highest balance`)
  const sorted = [...trips].sort((a, b) => b.balance - a.balance)
  return {
    trip: sorted[0],
    explanation: "Fallback: highest balance trip"
  }
}

// =============================================================================
// JOURNEY-BASED PATH RECOMMENDATION
// =============================================================================

/**
 * Get recommended path for a rat based on the most profitable journey
 */
export async function getRecommendedPath(
  ratValue: number,
  _inventory: string[],
  worldAddress: string,
  trips: Trip[],
  maxSteps: number = 5
): Promise<Array<{ tripId: string; expectedValue: number; cumulativeValue: number }>> {
  const builder = await initializeGraph(worldAddress, trips)
  const graph = builder.getGraph()

  // Build set of available trip IDs
  const availableTripIds = new Set(trips.map(t => t.id))

  // Get journeys sorted by peak value
  const journeys = [...graph.successfulJourneys].sort((a, b) => b.peakValue - a.peakValue)

  if (journeys.length === 0) {
    return []
  }

  // Find the first journey where the first trip is available
  for (const journey of journeys) {
    const journeyTripIds = journey.steps.map(s => s.tripId)
    const firstTripId = journeyTripIds[0]

    if (!availableTripIds.has(firstTripId)) continue

    // Build path from this journey
    const path: Array<{ tripId: string; expectedValue: number; cumulativeValue: number }> = []
    let cumulativeValue = ratValue

    for (let i = 0; i < Math.min(maxSteps, journey.steps.length); i++) {
      const step = journey.steps[i]
      if (!availableTripIds.has(step.tripId)) break

      cumulativeValue += step.valueChange
      path.push({
        tripId: step.tripId,
        expectedValue: step.valueChange,
        cumulativeValue
      })
    }

    if (path.length > 0) {
      console.log(
        `[Graph] Recommended path from ${journey.ratName}'s journey (peak: ${journey.peakValue})`
      )
      return path
    }
  }

  return []
}

// Re-export types
export * from "./types"
