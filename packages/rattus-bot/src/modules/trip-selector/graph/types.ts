/**
 * ========================================
 * Graph-Based Trip Selection Strategy Types
 * ========================================
 *
 * This module defines types for an in-memory graph that models:
 * - Trip nodes with outcome statistics
 * - Item influence on trip outcomes
 * - Successful rat path patterns
 * - Value-gated accessibility between trips
 */

import type { Trip } from "../../../types"

// =============================================================================
// VALUE BUCKETS
// Outcomes vary based on rat's entry value - segment analysis by value range
// =============================================================================

export type ValueBucket = "very_low" | "low" | "medium" | "high" | "very_high"

export const VALUE_BUCKET_RANGES: Record<ValueBucket, { min: number; max: number }> = {
  very_low: { min: 0, max: 200 },
  low: { min: 200, max: 1000 },
  medium: { min: 1000, max: 3000 },
  high: { min: 3000, max: 10000 },
  very_high: { min: 10000, max: Infinity }
}

// =============================================================================
// ITEM TRACKING
// =============================================================================

export interface ItemInfo {
  id: string
  name: string
  value: number
}

/**
 * Tracks how a specific item influences outcomes on a trip
 */
export interface ItemInfluence {
  itemId: string
  itemName: string

  // Stats when rat HAD this item on entrance
  withItem: {
    outcomes: number
    avgValueChange: number
    survivalRate: number
    // Items commonly gained when entering with this item
    commonGains: Array<{ itemName: string; frequency: number }>
  }

  // Stats when rat did NOT have this item
  withoutItem: {
    outcomes: number
    avgValueChange: number
    survivalRate: number
  }

  // Computed influence score (positive = item helps, negative = item hurts)
  influenceScore: number
}

/**
 * Items commonly awarded by a trip
 */
export interface ItemAward {
  itemId: string
  itemName: string
  itemValue: number
  frequency: number // 0-1, how often this item is awarded
  // Conditional: more likely if rat survives with high value gain
  conditionalOnSuccess: boolean
}

// =============================================================================
// TRIP STATISTICS
// =============================================================================

export interface BucketStats {
  bucket: ValueBucket
  outcomes: number
  avgValueChange: number
  medianValueChange: number
  stdDevValueChange: number
  survivalRate: number
  avgValueGainOnSurvival: number
  avgValueLossOnDeath: number
}

export interface TripStatistics {
  tripId: string
  totalOutcomes: number
  lastUpdated: Date

  // Overall stats
  overall: {
    avgValueChange: number
    medianValueChange: number
    stdDevValueChange: number
    survivalRate: number
    avgValueGainOnSurvival: number
    avgValueLossOnDeath: number
  }

  // Segmented by entry value
  byValueBucket: Map<ValueBucket, BucketStats>

  // Item influence analysis
  itemInfluence: Map<string, ItemInfluence> // itemName -> influence

  // Items commonly awarded by this trip
  itemAwards: ItemAward[]

  // Trips commonly taken BEFORE this one (predecessor analysis)
  commonPredecessors: Array<{
    tripId: string
    frequency: number
    avgValueChangeAfter: number // How well rats did on THIS trip after coming from predecessor
  }>

  // Trips commonly taken AFTER this one (successor analysis)
  commonSuccessors: Array<{
    tripId: string
    frequency: number
    avgValueChangeOnSuccessor: number
  }>
}

// =============================================================================
// TRIP NODE (Graph Vertex)
// =============================================================================

export interface TripNode {
  tripId: string
  trip: Trip
  stats: TripStatistics

  // Minimum rat value required to enter
  minEntryValue: number

  // Is this trip currently active (has balance)?
  active: boolean
}

// =============================================================================
// TRIP EDGE (Graph Edge - computed dynamically)
// =============================================================================

export interface TripEdge {
  fromTripId: string
  toTripId: string

  // Probability this edge is traversable (rat survives from AND can afford to)
  accessibilityProbability: number

  // Expected value gained by taking this path
  expectedValueGain: number

  // Items that make this transition more successful
  beneficialItems: string[]

  // Historical success rate of this specific transition
  transitionSuccessRate: number
  transitionCount: number
}

// =============================================================================
// RAT JOURNEY (Path Reconstruction)
// =============================================================================

export interface JourneyStep {
  tripId: string
  tripPrompt: string
  valueChange: number
  valueBefore: number
  valueAfter: number
  survived: boolean
  itemsOnEntrance: ItemInfo[]
  itemsGained: ItemInfo[]
  itemsLost: ItemInfo[]
}

export interface RatJourney {
  ratId: string
  ratName: string
  playerId: string

  // The sequence of trips this rat took
  steps: JourneyStep[]

  // Journey metrics
  totalTrips: number
  totalValueGained: number
  finalValue: number
  survived: boolean // Did rat survive entire journey?

  // Peak value achieved
  peakValue: number
  peakValueStep: number

  // Items collected during journey
  uniqueItemsCollected: string[]
}

/**
 * A successful path pattern extracted from multiple rat journeys
 */
export interface PathPattern {
  // Sequence of trip IDs
  tripSequence: string[]

  // How many rats followed this exact pattern
  occurrences: number

  // Average total value gain for rats following this pattern
  avgTotalValueGain: number

  // Survival rate through entire pattern
  completionRate: number

  // Key items that successful rats had
  keyItems: Array<{
    itemName: string
    acquiredAtStep: number
    importanceScore: number
  }>

  // Entry value range where this pattern works best
  optimalEntryValueRange: { min: number; max: number }
}

// =============================================================================
// GRAPH STATE
// =============================================================================

export interface TripGraph {
  worldAddress: string
  nodes: Map<string, TripNode>
  edges: Map<string, TripEdge[]> // fromTripId -> edges

  // Reconstructed successful journeys
  successfulJourneys: RatJourney[]

  // Extracted path patterns
  pathPatterns: PathPattern[]

  // Metadata
  lastFullRebuild: Date
  outcomeCount: number

  // Game config cached
  minRatValueToEnterPercent: number
}

// =============================================================================
// STRATEGY CONFIGURATION
// =============================================================================

export interface GraphStrategyConfig {
  // Pathfinding parameters
  lookAheadDepth: number // How many trips to look ahead (default: 3)
  simulations: number // Monte Carlo simulations per path (default: 50)

  // Risk parameters
  riskTolerance: number // 0-1, higher = accept more death risk (default: 0.5)
  minSurvivalRate: number // Don't consider trips below this survival rate (default: 0.3)

  // Exploration vs exploitation
  explorationBonus: number // Bonus for low-data trips (default: 0.2)
  minOutcomesForConfidence: number // Need this many outcomes for confidence (default: 5)

  // Item considerations
  itemInfluenceWeight: number // How much to weight item bonuses (default: 1.0)

  // Path pattern matching
  usePathPatterns: boolean // Try to follow successful patterns (default: true)
  pathPatternWeight: number // Weight for pattern matching bonus (default: 0.5)
}

export const DEFAULT_GRAPH_CONFIG: GraphStrategyConfig = {
  lookAheadDepth: 1, // Reduced from 3 to avoid O(n^depth) exponential blowup with many trips
  simulations: 50,
  riskTolerance: 0.5,
  minSurvivalRate: 0.3,
  explorationBonus: 0.2,
  minOutcomesForConfidence: 5,
  itemInfluenceWeight: 1.0,
  usePathPatterns: true,
  pathPatternWeight: 0.5
}

// =============================================================================
// CMS OUTCOME (Extended for graph building)
// =============================================================================

export interface ExtendedOutcome {
  _id: string
  _createdAt: string
  tripId: string
  tripIndex: number
  ratId: string
  ratName: string
  playerId: string
  playerName: string

  // Value tracking
  ratValueChange: number
  ratValue: number
  oldRatValue: number
  newRatBalance: number
  oldRatBalance: number

  // Item tracking
  inventoryOnEntrance: ItemInfo[]
  itemChanges: Array<{
    name: string
    type: "gained" | "lost"
    value: number
    id: string
  }>
  itemsLostOnDeath: ItemInfo[]

  // Derived
  died: boolean
  survived: boolean
}

// =============================================================================
// SCORING RESULT
// =============================================================================

export interface TripScore {
  tripId: string
  trip: Trip

  // Component scores
  baseExpectedValue: number
  survivalAdjustment: number
  itemInfluenceBonus: number
  explorationBonus: number
  lookAheadValue: number
  pathPatternBonus: number

  // Final score
  totalScore: number

  // Explanation components
  explanation: {
    primary: string
    details: string[]
  }
}
