/**
 * ========================================
 * Pathfinding Algorithm
 * ========================================
 *
 * Finds the optimal trip using:
 * - Expected value calculation with value bucket segmentation
 * - Item influence bonuses
 * - Look-ahead simulation
 * - Path pattern matching
 * - Monte Carlo simulation for uncertainty
 */

import type {
  TripGraph,
  TripNode,
  TripScore,
  GraphStrategyConfig,
  PathPattern,
  ValueBucket,
  BucketStats
} from "./types"
import { VALUE_BUCKET_RANGES, DEFAULT_GRAPH_CONFIG } from "./types"
import { findSimilarJourneys } from "./path-reconstruction"

// =============================================================================
// HELPERS
// =============================================================================

function getValueBucket(value: number): ValueBucket {
  for (const [bucket, range] of Object.entries(VALUE_BUCKET_RANGES)) {
    if (value >= range.min && value < range.max) {
      return bucket as ValueBucket
    }
  }
  return "very_high"
}

function getBucketStats(node: TripNode, ratValue: number): BucketStats | null {
  const bucket = getValueBucket(ratValue)
  return node.stats.byValueBucket.get(bucket) || null
}

// =============================================================================
// TRIP SCORING
// =============================================================================

/**
 * Score a single trip considering all factors
 */
export function scoreTrip(
  node: TripNode,
  ratValue: number,
  inventory: string[],
  graph: TripGraph,
  config: GraphStrategyConfig,
  currentPath: string[] = [],
  depth: number = 0
): TripScore {
  const score: TripScore = {
    tripId: node.tripId,
    trip: node.trip,
    baseExpectedValue: 0,
    survivalAdjustment: 0,
    itemInfluenceBonus: 0,
    explorationBonus: 0,
    lookAheadValue: 0,
    pathPatternBonus: 0,
    totalScore: 0,
    explanation: {
      primary: "",
      details: []
    }
  }

  // Get bucket-specific stats or fall back to overall
  const bucketStats = getBucketStats(node, ratValue)
  const stats = bucketStats || {
    outcomes: node.stats.totalOutcomes,
    avgValueChange: node.stats.overall.avgValueChange,
    survivalRate: node.stats.overall.survivalRate,
    avgValueGainOnSurvival: node.stats.overall.avgValueGainOnSurvival,
    avgValueLossOnDeath: node.stats.overall.avgValueLossOnDeath
  }

  // 1. Base expected value
  score.baseExpectedValue = stats.avgValueChange
  score.explanation.details.push(`Base EV: ${stats.avgValueChange.toFixed(1)}`)

  // 2. Survival adjustment based on risk tolerance
  const survivalRate = stats.survivalRate
  if (survivalRate < config.minSurvivalRate) {
    // Below minimum, heavy penalty
    score.survivalAdjustment = -1000
    score.explanation.details.push(`Survival ${(survivalRate * 100).toFixed(0)}% below min`)
  } else {
    // Adjust score based on survival rate and risk tolerance
    // Higher risk tolerance = less penalty for low survival
    const survivalPenalty = Math.pow(survivalRate, 1 / config.riskTolerance)
    score.survivalAdjustment = (survivalPenalty - 1) * Math.abs(score.baseExpectedValue)
    score.explanation.details.push(
      `Survival adj: ${score.survivalAdjustment.toFixed(1)} (${(survivalRate * 100).toFixed(0)}%)`
    )
  }

  // 3. Item influence bonus
  score.itemInfluenceBonus = calculateItemInfluenceBonus(node, inventory, config)
  if (score.itemInfluenceBonus !== 0) {
    score.explanation.details.push(`Item bonus: ${score.itemInfluenceBonus.toFixed(1)}`)
  }

  // 4. Exploration bonus for low-data trips
  if (stats.outcomes < config.minOutcomesForConfidence) {
    // Give exploration bonus based on trip balance (proxy for potential reward)
    score.explorationBonus = config.explorationBonus * node.trip.balance * 0.01
    score.explanation.details.push(
      `Explore bonus: ${score.explorationBonus.toFixed(1)} (${stats.outcomes} outcomes)`
    )
  }

  // 5. Path pattern matching bonus
  if (config.usePathPatterns && currentPath.length > 0) {
    score.pathPatternBonus = calculatePathPatternBonus(
      node.tripId,
      currentPath,
      graph.pathPatterns,
      config
    )
    if (score.pathPatternBonus !== 0) {
      score.explanation.details.push(`Pattern bonus: ${score.pathPatternBonus.toFixed(1)}`)
    }
  }

  // 6. Look-ahead value (recursive)
  if (depth < config.lookAheadDepth && survivalRate >= config.minSurvivalRate) {
    score.lookAheadValue = calculateLookAheadValue(
      node,
      ratValue + stats.avgValueChange,
      inventory,
      graph,
      config,
      [...currentPath, node.tripId],
      depth + 1
    )
    if (score.lookAheadValue !== 0) {
      score.explanation.details.push(`Look-ahead: ${score.lookAheadValue.toFixed(1)}`)
    }
  }

  // Calculate total score
  score.totalScore =
    score.baseExpectedValue +
    score.survivalAdjustment +
    score.itemInfluenceBonus * config.itemInfluenceWeight +
    score.explorationBonus +
    score.pathPatternBonus * config.pathPatternWeight +
    score.lookAheadValue * survivalRate // Discount future value by survival probability

  // Build primary explanation
  if (stats.outcomes === 0) {
    score.explanation.primary = `Unexplored trip (balance: ${node.trip.balance})`
  } else if (survivalRate < config.minSurvivalRate) {
    score.explanation.primary = `Too risky (${(survivalRate * 100).toFixed(0)}% survival)`
  } else {
    const sign = stats.avgValueChange >= 0 ? "+" : ""
    score.explanation.primary = `EV: ${sign}${stats.avgValueChange.toFixed(0)}, ${(survivalRate * 100).toFixed(0)}% survival`
  }

  return score
}

/**
 * Calculate bonus from items the rat currently has
 */
function calculateItemInfluenceBonus(
  node: TripNode,
  inventory: string[],
  _config: GraphStrategyConfig
): number {
  let bonus = 0

  for (const itemName of inventory) {
    const influence = node.stats.itemInfluence.get(itemName)
    if (influence && influence.influenceScore > 0) {
      // Positive influence - this item helps on this trip
      bonus += influence.influenceScore
    }
  }

  // Also check for items this trip commonly awards that are beneficial elsewhere
  for (const award of node.stats.itemAwards) {
    // Small bonus for trips that give valuable items
    if (award.frequency > 0.2 && award.itemValue > 100) {
      bonus += award.frequency * 10
    }
  }

  return bonus
}

/**
 * Calculate bonus for following known successful patterns
 */
function calculatePathPatternBonus(
  tripId: string,
  currentPath: string[],
  patterns: PathPattern[],
  _config: GraphStrategyConfig
): number {
  let maxBonus = 0

  for (const pattern of patterns) {
    // Find if this is the next step in a known pattern
    for (let i = 0; i < pattern.tripSequence.length; i++) {
      // Check if currentPath matches the prefix of this pattern
      const patternPrefix = pattern.tripSequence.slice(0, i)
      const patternNext = pattern.tripSequence[i]

      if (
        currentPath.length === patternPrefix.length &&
        currentPath.every((t, idx) => t === patternPrefix[idx]) &&
        patternNext === tripId
      ) {
        // This trip is the next step in a known pattern!
        const patternBonus =
          pattern.avgTotalValueGain * pattern.completionRate * Math.log(pattern.occurrences + 1)

        if (patternBonus > maxBonus) {
          maxBonus = patternBonus
        }
      }
    }
  }

  return maxBonus * 0.1 // Scale down to reasonable range
}

/**
 * Calculate expected value from future trips (look-ahead)
 * Uses pruning to avoid exponential blowup - only evaluates top N trips by raw EV
 */
const MAX_LOOKAHEAD_CANDIDATES = 10 // Only consider top 10 trips at each depth

function calculateLookAheadValue(
  currentNode: TripNode,
  expectedRatValue: number,
  inventory: string[],
  graph: TripGraph,
  config: GraphStrategyConfig,
  currentPath: string[],
  depth: number
): number {
  // Find accessible trips after this one
  const accessibleTrips: TripNode[] = []
  for (const node of graph.nodes.values()) {
    if (
      node.active &&
      expectedRatValue >= node.minEntryValue &&
      node.tripId !== currentNode.tripId
    ) {
      accessibleTrips.push(node)
    }
  }

  if (accessibleTrips.length === 0) return 0

  // Prune: only consider top N trips by raw expected value to avoid exponential blowup
  // Sort by raw EV first (fast), then only fully score the top candidates
  const candidatesWithEV = accessibleTrips.map(node => ({
    node,
    rawEV: node.stats.overall.avgValueChange
  }))
  candidatesWithEV.sort((a, b) => b.rawEV - a.rawEV)
  const topCandidates = candidatesWithEV.slice(0, MAX_LOOKAHEAD_CANDIDATES)

  // Score only the top candidates
  const scores: number[] = []
  for (const { node } of topCandidates) {
    const tripScore = scoreTrip(
      node,
      expectedRatValue,
      inventory, // Simplified - don't simulate item changes
      graph,
      config,
      currentPath,
      depth
    )
    scores.push(tripScore.totalScore)
  }

  // Return the best score, discounted
  const bestScore = Math.max(...scores)
  return bestScore * 0.8 // Discount factor for future uncertainty
}

// =============================================================================
// MONTE CARLO SIMULATION
// =============================================================================

interface SimulationResult {
  tripId: string
  avgFinalValue: number
  survivalRate: number
  avgTripsCompleted: number
  valueDistribution: {
    min: number
    max: number
    p25: number
    p50: number
    p75: number
  }
}

/**
 * Run Monte Carlo simulation to evaluate a trip choice
 */
export function simulateTrip(
  node: TripNode,
  ratValue: number,
  inventory: string[],
  graph: TripGraph,
  config: GraphStrategyConfig,
  numSimulations: number = 50,
  maxSteps: number = 5
): SimulationResult {
  const finalValues: number[] = []
  let survivedCount = 0
  const tripsCompleted: number[] = []

  for (let sim = 0; sim < numSimulations; sim++) {
    let currentValue = ratValue
    const currentInventory = [...inventory]
    let survived = true
    let steps = 0

    // Start with the specified trip
    const firstOutcome = sampleOutcome(node, currentValue)
    currentValue += firstOutcome.valueChange
    survived = firstOutcome.survived

    if (firstOutcome.itemsGained) {
      currentInventory.push(...firstOutcome.itemsGained)
    }
    steps++

    // Continue simulating future trips
    while (survived && steps < maxSteps && currentValue > 0) {
      // Find best accessible trip
      const accessible = Array.from(graph.nodes.values()).filter(
        n => n.active && currentValue >= n.minEntryValue
      )

      if (accessible.length === 0) break

      // Pick the one with best expected value (greedy for simulation)
      let bestNode: TripNode | null = null
      let bestEV = -Infinity
      for (const n of accessible) {
        const bucketStats = getBucketStats(n, currentValue)
        const ev = bucketStats?.avgValueChange ?? n.stats.overall.avgValueChange
        if (ev > bestEV) {
          bestEV = ev
          bestNode = n
        }
      }

      if (!bestNode) break

      const outcome = sampleOutcome(bestNode, currentValue)
      currentValue += outcome.valueChange
      survived = outcome.survived

      if (outcome.itemsGained) {
        currentInventory.push(...outcome.itemsGained)
      }
      steps++
    }

    finalValues.push(Math.max(0, currentValue))
    if (survived) survivedCount++
    tripsCompleted.push(steps)
  }

  // Calculate statistics
  const sorted = [...finalValues].sort((a, b) => a - b)

  return {
    tripId: node.tripId,
    avgFinalValue: finalValues.reduce((a, b) => a + b, 0) / numSimulations,
    survivalRate: survivedCount / numSimulations,
    avgTripsCompleted: tripsCompleted.reduce((a, b) => a + b, 0) / numSimulations,
    valueDistribution: {
      min: sorted[0],
      max: sorted[sorted.length - 1],
      p25: sorted[Math.floor(sorted.length * 0.25)],
      p50: sorted[Math.floor(sorted.length * 0.5)],
      p75: sorted[Math.floor(sorted.length * 0.75)]
    }
  }
}

/**
 * Sample an outcome from a trip based on historical distribution
 */
function sampleOutcome(
  node: TripNode,
  ratValue: number
): {
  valueChange: number
  survived: boolean
  itemsGained: string[]
} {
  const bucketStats = getBucketStats(node, ratValue)
  const stats = bucketStats || node.stats.overall

  // Sample survival
  const survived = Math.random() < stats.survivalRate

  // Sample value change
  let valueChange: number
  if (node.stats.totalOutcomes === 0) {
    // No data - use trip balance as proxy
    valueChange = survived ? node.trip.balance * 0.1 * (0.5 + Math.random()) : -ratValue * 0.5
  } else {
    // Sample from normal distribution approximation
    const mean = survived
      ? (stats as BucketStats).avgValueGainOnSurvival || stats.avgValueChange
      : (stats as BucketStats).avgValueLossOnDeath || -ratValue
    const stdDev = (stats as BucketStats).stdDevValueChange || Math.abs(mean * 0.5)

    // Box-Muller transform for normal distribution
    const u1 = Math.random()
    const u2 = Math.random()
    const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2)
    valueChange = mean + z * stdDev
  }

  // Sample items gained (simplified)
  const itemsGained: string[] = []
  if (survived) {
    for (const award of node.stats.itemAwards) {
      if (Math.random() < award.frequency) {
        itemsGained.push(award.itemName)
      }
    }
  }

  return { valueChange, survived, itemsGained }
}

// =============================================================================
// SIMILAR JOURNEY GUIDANCE
// =============================================================================

/**
 * Get guidance from similar successful journeys
 */
export function getJourneyGuidance(
  currentPath: string[],
  currentItems: string[],
  graph: TripGraph
): {
  suggestedTrips: Array<{ tripId: string; confidence: number; reason: string }>
  warnings: string[]
} {
  const similar = findSimilarJourneys(currentPath, currentItems, graph.successfulJourneys, 5)

  const tripVotes = new Map<string, { count: number; totalSimilarity: number }>()
  const warnings: string[] = []

  for (const { similarity, nextTrips } of similar) {
    if (nextTrips.length > 0) {
      const nextTrip = nextTrips[0]
      const existing = tripVotes.get(nextTrip) || { count: 0, totalSimilarity: 0 }
      existing.count++
      existing.totalSimilarity += similarity
      tripVotes.set(nextTrip, existing)
    }
  }

  const suggestedTrips = Array.from(tripVotes.entries())
    .map(([tripId, data]) => ({
      tripId,
      confidence: data.totalSimilarity / data.count,
      reason: `${data.count} similar rats took this next`
    }))
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 3)

  // Check for warning patterns
  if (currentPath.length > 5) {
    const avgPathLength =
      graph.successfulJourneys.reduce((sum, j) => sum + j.totalTrips, 0) /
      graph.successfulJourneys.length
    if (currentPath.length > avgPathLength * 1.5) {
      warnings.push("You've taken more trips than most successful rats - consider liquidating")
    }
  }

  return { suggestedTrips, warnings }
}

// =============================================================================
// MAIN PATHFINDING FUNCTION
// =============================================================================

/**
 * Find the best trip to take
 */
export function findBestTrip(
  graph: TripGraph,
  ratValue: number,
  inventory: string[],
  config: GraphStrategyConfig = DEFAULT_GRAPH_CONFIG,
  currentPath: string[] = []
): {
  scores: TripScore[]
  best: TripScore | null
  guidance: ReturnType<typeof getJourneyGuidance>
} {
  // Get accessible trips
  const accessibleNodes: TripNode[] = []
  for (const node of graph.nodes.values()) {
    if (node.active && ratValue >= node.minEntryValue) {
      accessibleNodes.push(node)
    }
  }

  console.log(`[Pathfinder] Scoring ${accessibleNodes.length} accessible trips...`)

  if (accessibleNodes.length === 0) {
    return {
      scores: [],
      best: null,
      guidance: { suggestedTrips: [], warnings: ["No accessible trips"] }
    }
  }

  // Score all accessible trips with progress logging
  const scores: TripScore[] = []
  const logEvery = Math.max(1, Math.floor(accessibleNodes.length / 10))
  for (let i = 0; i < accessibleNodes.length; i++) {
    if (i % logEvery === 0) {
      console.log(`[Pathfinder] Scoring trip ${i + 1}/${accessibleNodes.length}...`)
    }
    const score = scoreTrip(accessibleNodes[i], ratValue, inventory, graph, config, currentPath, 0)
    scores.push(score)
  }
  console.log(`[Pathfinder] Scoring complete`)

  // Sort by total score
  scores.sort((a, b) => b.totalScore - a.totalScore)

  // Get journey guidance
  console.log(`[Pathfinder] Getting journey guidance...`)
  const guidance = getJourneyGuidance(currentPath, inventory, graph)

  // Combine scoring with journey guidance
  const best = scores[0] || null

  // If journey guidance strongly suggests a different trip, note it
  if (
    guidance.suggestedTrips.length > 0 &&
    best &&
    guidance.suggestedTrips[0].tripId !== best.tripId &&
    guidance.suggestedTrips[0].confidence > 0.7
  ) {
    guidance.warnings.push(`Similar successful rats took ${guidance.suggestedTrips[0].tripId} next`)
  }

  console.log(
    `[Pathfinder] Best trip found: ${best?.tripId.slice(0, 10)}... (score: ${best?.totalScore.toFixed(1)})`
  )

  return { scores, best, guidance }
}
