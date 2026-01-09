/**
 * ========================================
 * Graph Builder & Cache
 * ========================================
 *
 * Constructs and maintains the in-memory trip graph:
 * - Initial build from CMS data
 * - Incremental updates on new outcomes
 * - Trip addition/removal handling
 * - Edge computation for pathfinding
 */

import type { TripGraph, TripNode, TripEdge, ExtendedOutcome } from "./types"
import type { Trip } from "../../../types"
import { calculateTripStatistics, updateStatisticsWithOutcome } from "./statistics"
import {
  reconstructJourneys,
  filterSuccessfulJourneys,
  extractPathPatterns
} from "./path-reconstruction"
import { sanityClient } from "../../cms"

// =============================================================================
// CMS DATA FETCHING
// =============================================================================

/**
 * Fetch all outcomes for trips with extended data
 */
async function fetchExtendedOutcomes(
  tripIds: string[],
  worldAddress: string
): Promise<ExtendedOutcome[]> {
  if (tripIds.length === 0) return []

  // Query with all fields we need for graph building
  const query = `*[_type == "outcome" && tripId in $tripIds && worldAddress == $worldAddress] {
    _id,
    _createdAt,
    tripId,
    tripIndex,
    ratId,
    ratName,
    playerId,
    playerName,
    ratValueChange,
    ratValue,
    oldRatValue,
    newRatBalance,
    oldRatBalance,
    inventoryOnEntrance[] {
      "id": id,
      "name": name,
      "value": value
    },
    itemChanges[] {
      "name": name,
      "type": type,
      "value": value,
      "id": id
    },
    itemsLostOnDeath[] {
      "id": id,
      "name": name,
      "value": value
    }
  }`

  const outcomes = await sanityClient.fetch<ExtendedOutcome[]>(query, { tripIds, worldAddress })

  // Mark died/survived
  return outcomes.map(o => ({
    ...o,
    died: o.newRatBalance === 0 && (o.oldRatBalance ?? 0) > 0,
    survived: !(o.newRatBalance === 0 && (o.oldRatBalance ?? 0) > 0)
  }))
}

/**
 * Fetch ALL outcomes for a world (for journey reconstruction)
 */
async function fetchAllOutcomes(worldAddress: string): Promise<ExtendedOutcome[]> {
  const query = `*[_type == "outcome" && worldAddress == $worldAddress] | order(_createdAt asc) {
    _id,
    _createdAt,
    tripId,
    tripIndex,
    ratId,
    ratName,
    playerId,
    playerName,
    ratValueChange,
    ratValue,
    oldRatValue,
    newRatBalance,
    oldRatBalance,
    inventoryOnEntrance[] {
      "id": id,
      "name": name,
      "value": value
    },
    itemChanges[] {
      "name": name,
      "type": type,
      "value": value,
      "id": id
    },
    itemsLostOnDeath[] {
      "id": id,
      "name": name,
      "value": value
    }
  }`

  const outcomes = await sanityClient.fetch<ExtendedOutcome[]>(query, { worldAddress })

  return outcomes.map(o => ({
    ...o,
    died: o.newRatBalance === 0 && (o.oldRatBalance ?? 0) > 0,
    survived: !(o.newRatBalance === 0 && (o.oldRatBalance ?? 0) > 0)
  }))
}

// =============================================================================
// GRAPH BUILDER CLASS
// =============================================================================

export class TripGraphBuilder {
  private graph: TripGraph
  private initialized: boolean = false

  constructor(worldAddress: string, minRatValueToEnterPercent: number = 30) {
    this.graph = {
      worldAddress,
      nodes: new Map(),
      edges: new Map(),
      successfulJourneys: [],
      pathPatterns: [],
      lastFullRebuild: new Date(),
      outcomeCount: 0,
      minRatValueToEnterPercent
    }
  }

  /**
   * Get the current graph state
   */
  getGraph(): TripGraph {
    return this.graph
  }

  /**
   * Check if graph is initialized
   */
  isInitialized(): boolean {
    return this.initialized
  }

  /**
   * Initialize the graph from CMS data
   */
  async initialize(trips: Trip[]): Promise<void> {
    console.log(`[GraphBuilder] Initializing graph with ${trips.length} trips...`)

    // Fetch all outcomes for this world
    console.log(`[GraphBuilder] Fetching all outcomes from CMS...`)
    const allOutcomes = await fetchAllOutcomes(this.graph.worldAddress)
    console.log(`[GraphBuilder] Fetched ${allOutcomes.length} outcomes`)

    this.graph.outcomeCount = allOutcomes.length

    // Group outcomes by trip
    const outcomesByTrip = new Map<string, ExtendedOutcome[]>()
    for (const outcome of allOutcomes) {
      const existing = outcomesByTrip.get(outcome.tripId) || []
      existing.push(outcome)
      outcomesByTrip.set(outcome.tripId, existing)
    }

    // Build nodes for each trip
    console.log(`[GraphBuilder] Building trip nodes...`)
    for (const trip of trips) {
      const tripOutcomes = outcomesByTrip.get(trip.id) || []
      const stats = calculateTripStatistics(trip, tripOutcomes, allOutcomes)

      const minEntryValue = Math.floor(
        (trip.tripCreationCost * this.graph.minRatValueToEnterPercent) / 100
      )

      const node: TripNode = {
        tripId: trip.id,
        trip,
        stats,
        minEntryValue,
        active: trip.balance > 0
      }

      this.graph.nodes.set(trip.id, node)
    }

    // Reconstruct journeys and extract patterns
    console.log(`[GraphBuilder] Reconstructing rat journeys...`)
    const journeys = reconstructJourneys(allOutcomes)
    console.log(`[GraphBuilder] Found ${journeys.length} rat journeys`)

    // Filter for successful journeys
    const successfulJourneys = filterSuccessfulJourneys(journeys, {
      minTrips: 3,
      minTotalValueGain: 300,
      minFinalValue: 500
    })
    console.log(`[GraphBuilder] Found ${successfulJourneys.length} successful journeys`)

    this.graph.successfulJourneys = successfulJourneys

    // Extract path patterns
    console.log(`[GraphBuilder] Extracting path patterns...`)
    const patterns = extractPathPatterns(successfulJourneys, 2)
    console.log(`[GraphBuilder] Found ${patterns.length} path patterns`)

    this.graph.pathPatterns = patterns

    // Compute edges between trips
    console.log(`[GraphBuilder] Computing trip edges...`)
    this.computeEdges(allOutcomes)

    this.graph.lastFullRebuild = new Date()
    this.initialized = true

    console.log(`[GraphBuilder] Graph initialization complete`)
    this.logGraphStats()
  }

  /**
   * Compute edges between trips based on historical transitions
   */
  private computeEdges(allOutcomes: ExtendedOutcome[]): void {
    // Group outcomes by rat to find transitions
    const outcomesByRat = new Map<string, ExtendedOutcome[]>()
    for (const outcome of allOutcomes) {
      const existing = outcomesByRat.get(outcome.ratId) || []
      existing.push(outcome)
      outcomesByRat.set(outcome.ratId, existing)
    }

    // Track transitions
    const transitions = new Map<
      string,
      {
        fromTripId: string
        toTripId: string
        count: number
        survivedCount: number
        valueGains: number[]
      }
    >()

    for (const outcomes of outcomesByRat.values()) {
      // Sort by time
      const sorted = [...outcomes].sort(
        (a, b) => new Date(a._createdAt).getTime() - new Date(b._createdAt).getTime()
      )

      for (let i = 0; i < sorted.length - 1; i++) {
        const from = sorted[i]
        const to = sorted[i + 1]

        // Only count if rat survived the first trip
        if (!from.survived) continue

        const key = `${from.tripId}->${to.tripId}`
        const existing = transitions.get(key) || {
          fromTripId: from.tripId,
          toTripId: to.tripId,
          count: 0,
          survivedCount: 0,
          valueGains: []
        }

        existing.count++
        if (to.survived) existing.survivedCount++
        existing.valueGains.push(to.ratValueChange)
        transitions.set(key, existing)
      }
    }

    // Convert to edges
    for (const [, data] of transitions) {
      if (data.count < 2) continue // Need at least 2 occurrences

      const avgValueGain = data.valueGains.reduce((a, b) => a + b, 0) / data.valueGains.length
      const successRate = data.survivedCount / data.count

      // Find beneficial items for this transition
      const beneficialItems = this.findBeneficialItemsForTransition(
        data.fromTripId,
        data.toTripId,
        allOutcomes
      )

      const edge: TripEdge = {
        fromTripId: data.fromTripId,
        toTripId: data.toTripId,
        accessibilityProbability: successRate, // Simplified - real value depends on rat value
        expectedValueGain: avgValueGain,
        beneficialItems,
        transitionSuccessRate: successRate,
        transitionCount: data.count
      }

      const existing = this.graph.edges.get(data.fromTripId) || []
      existing.push(edge)
      this.graph.edges.set(data.fromTripId, existing)
    }
  }

  /**
   * Find items that improve outcomes when transitioning between two trips
   */
  private findBeneficialItemsForTransition(
    fromTripId: string,
    toTripId: string,
    allOutcomes: ExtendedOutcome[]
  ): string[] {
    // Find rats that made this transition
    const outcomesByRat = new Map<string, ExtendedOutcome[]>()
    for (const outcome of allOutcomes) {
      const existing = outcomesByRat.get(outcome.ratId) || []
      existing.push(outcome)
      outcomesByRat.set(outcome.ratId, existing)
    }

    const transitionOutcomes: {
      itemsOnEntrance: string[]
      valueChange: number
      survived: boolean
    }[] = []

    for (const outcomes of outcomesByRat.values()) {
      const sorted = [...outcomes].sort(
        (a, b) => new Date(a._createdAt).getTime() - new Date(b._createdAt).getTime()
      )

      for (let i = 0; i < sorted.length - 1; i++) {
        if (sorted[i].tripId === fromTripId && sorted[i + 1].tripId === toTripId) {
          transitionOutcomes.push({
            itemsOnEntrance: (sorted[i + 1].inventoryOnEntrance || [])
              .map(item => item.name)
              .filter(Boolean) as string[],
            valueChange: sorted[i + 1].ratValueChange,
            survived: sorted[i + 1].survived
          })
        }
      }
    }

    if (transitionOutcomes.length < 3) return []

    // Find items that correlate with better outcomes
    const itemImpact = new Map<string, { withItem: number[]; withoutItem: number[] }>()

    // Collect all items
    const allItems = new Set<string>()
    for (const t of transitionOutcomes) {
      for (const item of t.itemsOnEntrance) {
        allItems.add(item)
      }
    }

    // Calculate impact for each item
    for (const item of allItems) {
      const withItem = transitionOutcomes
        .filter(t => t.itemsOnEntrance.includes(item))
        .map(t => t.valueChange)
      const withoutItem = transitionOutcomes
        .filter(t => !t.itemsOnEntrance.includes(item))
        .map(t => t.valueChange)

      if (withItem.length >= 2 && withoutItem.length >= 2) {
        itemImpact.set(item, { withItem, withoutItem })
      }
    }

    // Find beneficial items
    const beneficial: string[] = []
    for (const [item, impact] of itemImpact) {
      const avgWith = impact.withItem.reduce((a, b) => a + b, 0) / impact.withItem.length
      const avgWithout = impact.withoutItem.reduce((a, b) => a + b, 0) / impact.withoutItem.length

      if (avgWith > avgWithout + 50) {
        // Significant improvement
        beneficial.push(item)
      }
    }

    return beneficial.slice(0, 3) // Top 3
  }

  /**
   * Update the graph with a new outcome (incremental update)
   */
  updateWithOutcome(tripId: string, outcome: ExtendedOutcome): void {
    const node = this.graph.nodes.get(tripId)
    if (!node) {
      console.log(`[GraphBuilder] Trip ${tripId} not in graph, skipping update`)
      return
    }

    // Update statistics
    node.stats = updateStatisticsWithOutcome(node.stats, outcome)
    this.graph.outcomeCount++

    // Note: For full accuracy, we should periodically rebuild
    // edges and patterns, but incremental stat updates are sufficient
    // for trip selection decisions
  }

  /**
   * Mark a trip as depleted (balance = 0)
   */
  markTripDepleted(tripId: string): void {
    const node = this.graph.nodes.get(tripId)
    if (node) {
      node.active = false
      console.log(`[GraphBuilder] Marked trip ${tripId} as depleted`)
    }
  }

  /**
   * Add a new trip to the graph
   */
  async addTrip(trip: Trip): Promise<void> {
    // Fetch outcomes for this trip
    const outcomes = await fetchExtendedOutcomes([trip.id], this.graph.worldAddress)
    const allOutcomes = await fetchAllOutcomes(this.graph.worldAddress)

    const stats = calculateTripStatistics(trip, outcomes, allOutcomes)
    const minEntryValue = Math.floor(
      (trip.tripCreationCost * this.graph.minRatValueToEnterPercent) / 100
    )

    const node: TripNode = {
      tripId: trip.id,
      trip,
      stats,
      minEntryValue,
      active: trip.balance > 0
    }

    this.graph.nodes.set(trip.id, node)
    console.log(`[GraphBuilder] Added new trip ${trip.id}`)
  }

  /**
   * Update trip data (e.g., new balance)
   */
  updateTrip(trip: Trip): void {
    const node = this.graph.nodes.get(trip.id)
    if (node) {
      node.trip = trip
      node.active = trip.balance > 0
      node.minEntryValue = Math.floor(
        (trip.tripCreationCost * this.graph.minRatValueToEnterPercent) / 100
      )
    }
  }

  /**
   * Get edges from a trip
   */
  getEdgesFrom(tripId: string): TripEdge[] {
    return this.graph.edges.get(tripId) || []
  }

  /**
   * Get active trips that a rat can enter
   */
  getAccessibleTrips(ratValue: number): TripNode[] {
    const accessible: TripNode[] = []

    for (const node of this.graph.nodes.values()) {
      if (node.active && ratValue >= node.minEntryValue) {
        accessible.push(node)
      }
    }

    return accessible
  }

  /**
   * Full rebuild of the graph (call periodically for accuracy)
   */
  async rebuild(trips: Trip[]): Promise<void> {
    console.log(`[GraphBuilder] Performing full graph rebuild...`)
    this.initialized = false
    this.graph.nodes.clear()
    this.graph.edges.clear()
    await this.initialize(trips)
  }

  /**
   * Log graph statistics
   */
  private logGraphStats(): void {
    const activeNodes = Array.from(this.graph.nodes.values()).filter(n => n.active).length
    const totalEdges = Array.from(this.graph.edges.values()).reduce(
      (sum, edges) => sum + edges.length,
      0
    )

    console.log(`[GraphBuilder] Graph stats:`)
    console.log(`  - Total trips: ${this.graph.nodes.size}`)
    console.log(`  - Active trips: ${activeNodes}`)
    console.log(`  - Total edges: ${totalEdges}`)
    console.log(`  - Outcomes: ${this.graph.outcomeCount}`)
    console.log(`  - Successful journeys: ${this.graph.successfulJourneys.length}`)
    console.log(`  - Path patterns: ${this.graph.pathPatterns.length}`)
  }
}

// =============================================================================
// SINGLETON INSTANCE
// =============================================================================

let graphInstance: TripGraphBuilder | null = null

/**
 * Get or create the graph builder instance
 */
export function getGraphBuilder(
  worldAddress: string,
  minRatValueToEnterPercent: number = 30
): TripGraphBuilder {
  if (!graphInstance || graphInstance.getGraph().worldAddress !== worldAddress) {
    graphInstance = new TripGraphBuilder(worldAddress, minRatValueToEnterPercent)
  }
  return graphInstance
}

/**
 * Reset the graph builder (for testing or world change)
 */
export function resetGraphBuilder(): void {
  graphInstance = null
}
