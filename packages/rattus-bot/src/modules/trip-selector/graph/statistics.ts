/**
 * ========================================
 * Statistics Calculator
 * ========================================
 *
 * Computes trip statistics from CMS outcomes including:
 * - Value bucket segmentation
 * - Item influence analysis
 * - Item award patterns
 * - Predecessor/successor trip analysis
 */

import type {
  ExtendedOutcome,
  TripStatistics,
  BucketStats,
  ItemInfluence,
  ItemAward,
  ValueBucket
} from "./types"
import { VALUE_BUCKET_RANGES } from "./types"
import type { Trip } from "../../../types"

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

function median(values: number[]): number {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

function stdDev(values: number[], mean: number): number {
  if (values.length < 2) return 0
  const squaredDiffs = values.map(v => Math.pow(v - mean, 2))
  return Math.sqrt(squaredDiffs.reduce((a, b) => a + b, 0) / values.length)
}

function normalizeOutcome(outcome: ExtendedOutcome): ExtendedOutcome {
  // Ensure all fields have defaults
  return {
    ...outcome,
    inventoryOnEntrance: outcome.inventoryOnEntrance || [],
    itemChanges: outcome.itemChanges || [],
    itemsLostOnDeath: outcome.itemsLostOnDeath || [],
    died: outcome.newRatBalance === 0 && outcome.oldRatBalance > 0,
    survived: !(outcome.newRatBalance === 0 && outcome.oldRatBalance > 0)
  }
}

// =============================================================================
// MAIN STATISTICS CALCULATOR
// =============================================================================

export function calculateTripStatistics(
  trip: Trip,
  outcomes: ExtendedOutcome[],
  allOutcomes?: ExtendedOutcome[] // All outcomes for predecessor/successor analysis
): TripStatistics {
  const normalizedOutcomes = outcomes.map(normalizeOutcome)
  const tripId = trip.id

  // Initialize statistics structure
  const stats: TripStatistics = {
    tripId,
    totalOutcomes: normalizedOutcomes.length,
    lastUpdated: new Date(),
    overall: {
      avgValueChange: 0,
      medianValueChange: 0,
      stdDevValueChange: 0,
      survivalRate: 0,
      avgValueGainOnSurvival: 0,
      avgValueLossOnDeath: 0
    },
    byValueBucket: new Map(),
    itemInfluence: new Map(),
    itemAwards: [],
    commonPredecessors: [],
    commonSuccessors: []
  }

  if (normalizedOutcomes.length === 0) {
    return stats
  }

  // Calculate overall statistics
  const valueChanges = normalizedOutcomes.map(o => o.ratValueChange)
  const survived = normalizedOutcomes.filter(o => o.survived)
  const died = normalizedOutcomes.filter(o => o.died)

  stats.overall.avgValueChange = valueChanges.reduce((a, b) => a + b, 0) / valueChanges.length
  stats.overall.medianValueChange = median(valueChanges)
  stats.overall.stdDevValueChange = stdDev(valueChanges, stats.overall.avgValueChange)
  stats.overall.survivalRate = survived.length / normalizedOutcomes.length

  if (survived.length > 0) {
    stats.overall.avgValueGainOnSurvival =
      survived.map(o => o.ratValueChange).reduce((a, b) => a + b, 0) / survived.length
  }

  if (died.length > 0) {
    stats.overall.avgValueLossOnDeath =
      died.map(o => o.ratValueChange).reduce((a, b) => a + b, 0) / died.length
  }

  // Calculate by value bucket
  stats.byValueBucket = calculateBucketStats(normalizedOutcomes)

  // Calculate item influence
  stats.itemInfluence = calculateItemInfluence(normalizedOutcomes)

  // Calculate item awards
  stats.itemAwards = calculateItemAwards(normalizedOutcomes)

  // Calculate predecessor/successor patterns if we have all outcomes
  if (allOutcomes && allOutcomes.length > 0) {
    const { predecessors, successors } = calculateTripSequencePatterns(
      tripId,
      allOutcomes.map(normalizeOutcome)
    )
    stats.commonPredecessors = predecessors
    stats.commonSuccessors = successors
  }

  return stats
}

// =============================================================================
// BUCKET STATISTICS
// =============================================================================

function calculateBucketStats(outcomes: ExtendedOutcome[]): Map<ValueBucket, BucketStats> {
  const bucketMap = new Map<ValueBucket, BucketStats>()
  const bucketOutcomes = new Map<ValueBucket, ExtendedOutcome[]>()

  // Group outcomes by entry value bucket
  for (const outcome of outcomes) {
    const bucket = getValueBucket(outcome.oldRatValue || 0)
    const existing = bucketOutcomes.get(bucket) || []
    existing.push(outcome)
    bucketOutcomes.set(bucket, existing)
  }

  // Calculate stats for each bucket
  for (const [bucket, bucketOuts] of bucketOutcomes) {
    const valueChanges = bucketOuts.map(o => o.ratValueChange)
    const survived = bucketOuts.filter(o => o.survived)
    const died = bucketOuts.filter(o => o.died)

    const avgValueChange = valueChanges.reduce((a, b) => a + b, 0) / valueChanges.length

    const bucketStats: BucketStats = {
      bucket,
      outcomes: bucketOuts.length,
      avgValueChange,
      medianValueChange: median(valueChanges),
      stdDevValueChange: stdDev(valueChanges, avgValueChange),
      survivalRate: survived.length / bucketOuts.length,
      avgValueGainOnSurvival:
        survived.length > 0
          ? survived.map(o => o.ratValueChange).reduce((a, b) => a + b, 0) / survived.length
          : 0,
      avgValueLossOnDeath:
        died.length > 0
          ? died.map(o => o.ratValueChange).reduce((a, b) => a + b, 0) / died.length
          : 0
    }

    bucketMap.set(bucket, bucketStats)
  }

  return bucketMap
}

// =============================================================================
// ITEM INFLUENCE ANALYSIS
// =============================================================================

function calculateItemInfluence(outcomes: ExtendedOutcome[]): Map<string, ItemInfluence> {
  const influenceMap = new Map<string, ItemInfluence>()

  // Collect all unique items that appeared in inventories
  const allItems = new Map<string, { id: string; name: string }>()
  for (const outcome of outcomes) {
    for (const item of outcome.inventoryOnEntrance) {
      if (item.name) {
        allItems.set(item.name, { id: item.id, name: item.name })
      }
    }
  }

  // For each item, calculate stats with and without
  for (const [itemName, itemInfo] of allItems) {
    const withItem = outcomes.filter(o => o.inventoryOnEntrance.some(i => i.name === itemName))
    const withoutItem = outcomes.filter(o => !o.inventoryOnEntrance.some(i => i.name === itemName))

    // Skip if we don't have enough data for comparison
    if (withItem.length < 2 || withoutItem.length < 2) {
      continue
    }

    const withItemSurvived = withItem.filter(o => o.survived)
    const withoutItemSurvived = withoutItem.filter(o => o.survived)

    const withItemAvgChange =
      withItem.map(o => o.ratValueChange).reduce((a, b) => a + b, 0) / withItem.length
    const withoutItemAvgChange =
      withoutItem.map(o => o.ratValueChange).reduce((a, b) => a + b, 0) / withoutItem.length

    const withItemSurvivalRate = withItemSurvived.length / withItem.length
    const withoutItemSurvivalRate = withoutItemSurvived.length / withoutItem.length

    // Calculate common gains when entering with this item
    const itemGains = new Map<string, number>()
    for (const outcome of withItem) {
      for (const change of outcome.itemChanges) {
        if (change.type === "gained" && change.name) {
          itemGains.set(change.name, (itemGains.get(change.name) || 0) + 1)
        }
      }
    }

    const commonGains = Array.from(itemGains.entries())
      .map(([name, count]) => ({ itemName: name, frequency: count / withItem.length }))
      .filter(g => g.frequency > 0.1) // At least 10% frequency
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 5)

    // Influence score: combination of value change and survival improvement
    const valueInfluence = withItemAvgChange - withoutItemAvgChange
    const survivalInfluence = (withItemSurvivalRate - withoutItemSurvivalRate) * 100 // Weight survival more
    const influenceScore = valueInfluence + survivalInfluence

    const influence: ItemInfluence = {
      itemId: itemInfo.id,
      itemName,
      withItem: {
        outcomes: withItem.length,
        avgValueChange: withItemAvgChange,
        survivalRate: withItemSurvivalRate,
        commonGains
      },
      withoutItem: {
        outcomes: withoutItem.length,
        avgValueChange: withoutItemAvgChange,
        survivalRate: withoutItemSurvivalRate
      },
      influenceScore
    }

    influenceMap.set(itemName, influence)
  }

  return influenceMap
}

// =============================================================================
// ITEM AWARD ANALYSIS
// =============================================================================

function calculateItemAwards(outcomes: ExtendedOutcome[]): ItemAward[] {
  const itemCounts = new Map<
    string,
    { count: number; value: number; id: string; successCount: number }
  >()

  for (const outcome of outcomes) {
    for (const change of outcome.itemChanges) {
      if (change.type === "gained" && change.name) {
        const existing = itemCounts.get(change.name) || {
          count: 0,
          value: change.value || 0,
          id: change.id || "",
          successCount: 0
        }
        existing.count++
        if (outcome.survived && outcome.ratValueChange > 0) {
          existing.successCount++
        }
        itemCounts.set(change.name, existing)
      }
    }
  }

  const awards: ItemAward[] = []
  for (const [itemName, data] of itemCounts) {
    const frequency = data.count / outcomes.length
    const conditionalOnSuccess = data.successCount / data.count > 0.7 // 70%+ of awards on success

    awards.push({
      itemId: data.id,
      itemName,
      itemValue: data.value,
      frequency,
      conditionalOnSuccess
    })
  }

  return awards
    .filter(a => a.frequency > 0.05) // At least 5% frequency
    .sort((a, b) => b.frequency - a.frequency)
}

// =============================================================================
// TRIP SEQUENCE PATTERNS
// =============================================================================

interface TripSequenceResult {
  predecessors: Array<{
    tripId: string
    frequency: number
    avgValueChangeAfter: number
  }>
  successors: Array<{
    tripId: string
    frequency: number
    avgValueChangeOnSuccessor: number
  }>
}

function calculateTripSequencePatterns(
  tripId: string,
  allOutcomes: ExtendedOutcome[]
): TripSequenceResult {
  // Group outcomes by rat to reconstruct journeys
  const outcomesbyRat = new Map<string, ExtendedOutcome[]>()
  for (const outcome of allOutcomes) {
    const existing = outcomesbyRat.get(outcome.ratId) || []
    existing.push(outcome)
    outcomesbyRat.set(outcome.ratId, existing)
  }

  // Sort each rat's outcomes by creation date
  for (const outcomes of outcomesbyRat.values()) {
    outcomes.sort((a, b) => new Date(a._createdAt).getTime() - new Date(b._createdAt).getTime())
  }

  // Find predecessors and successors
  const predecessorCounts = new Map<string, { count: number; valueChanges: number[] }>()
  const successorCounts = new Map<string, { count: number; valueChanges: number[] }>()

  for (const ratOutcomes of outcomesbyRat.values()) {
    for (let i = 0; i < ratOutcomes.length; i++) {
      if (ratOutcomes[i].tripId === tripId) {
        // Found this trip in the rat's journey

        // Check predecessor (trip before this one)
        if (i > 0) {
          const prevTripId = ratOutcomes[i - 1].tripId
          const existing = predecessorCounts.get(prevTripId) || { count: 0, valueChanges: [] }
          existing.count++
          existing.valueChanges.push(ratOutcomes[i].ratValueChange) // How well rat did on THIS trip
          predecessorCounts.set(prevTripId, existing)
        }

        // Check successor (trip after this one)
        if (i < ratOutcomes.length - 1 && ratOutcomes[i].survived) {
          const nextTripId = ratOutcomes[i + 1].tripId
          const existing = successorCounts.get(nextTripId) || { count: 0, valueChanges: [] }
          existing.count++
          existing.valueChanges.push(ratOutcomes[i + 1].ratValueChange) // How well rat did on NEXT trip
          successorCounts.set(nextTripId, existing)
        }
      }
    }
  }

  // Calculate predecessor stats
  const thisTripsOutcomes = allOutcomes.filter(o => o.tripId === tripId)
  const totalOccurrences = thisTripsOutcomes.length

  const predecessors = Array.from(predecessorCounts.entries())
    .map(([predTripId, data]) => ({
      tripId: predTripId,
      frequency: data.count / totalOccurrences,
      avgValueChangeAfter:
        data.valueChanges.length > 0
          ? data.valueChanges.reduce((a, b) => a + b, 0) / data.valueChanges.length
          : 0
    }))
    .filter(p => p.frequency > 0.05) // At least 5% frequency
    .sort((a, b) => b.frequency - a.frequency)
    .slice(0, 10)

  const survivedCount = thisTripsOutcomes.filter(o => o.survived).length
  const successors = Array.from(successorCounts.entries())
    .map(([succTripId, data]) => ({
      tripId: succTripId,
      frequency: survivedCount > 0 ? data.count / survivedCount : 0,
      avgValueChangeOnSuccessor:
        data.valueChanges.length > 0
          ? data.valueChanges.reduce((a, b) => a + b, 0) / data.valueChanges.length
          : 0
    }))
    .filter(s => s.frequency > 0.05)
    .sort((a, b) => b.frequency - a.frequency)
    .slice(0, 10)

  return { predecessors, successors }
}

// =============================================================================
// INCREMENTAL UPDATE
// =============================================================================

/**
 * Update statistics with a new outcome (incremental update)
 */
export function updateStatisticsWithOutcome(
  existingStats: TripStatistics,
  newOutcome: ExtendedOutcome
): TripStatistics {
  const outcome = normalizeOutcome(newOutcome)
  const n = existingStats.totalOutcomes
  const newN = n + 1

  // Update overall statistics incrementally
  const newAvgValueChange =
    (existingStats.overall.avgValueChange * n + outcome.ratValueChange) / newN

  const oldSurvivedCount = existingStats.overall.survivalRate * n
  const newSurvivedCount = oldSurvivedCount + (outcome.survived ? 1 : 0)
  const newSurvivalRate = newSurvivedCount / newN

  // Update the stats
  const updatedStats: TripStatistics = {
    ...existingStats,
    totalOutcomes: newN,
    lastUpdated: new Date(),
    overall: {
      ...existingStats.overall,
      avgValueChange: newAvgValueChange,
      survivalRate: newSurvivalRate
      // Note: median and stdDev would need full recalculation for accuracy
      // but we keep them as approximations for performance
    }
  }

  // Update bucket stats
  const bucket = getValueBucket(outcome.oldRatValue || 0)
  const existingBucket = existingStats.byValueBucket.get(bucket)

  if (existingBucket) {
    const bucketN = existingBucket.outcomes
    const newBucketN = bucketN + 1
    const newBucketAvg =
      (existingBucket.avgValueChange * bucketN + outcome.ratValueChange) / newBucketN
    const oldBucketSurvived = existingBucket.survivalRate * bucketN
    const newBucketSurvived = oldBucketSurvived + (outcome.survived ? 1 : 0)

    updatedStats.byValueBucket.set(bucket, {
      ...existingBucket,
      outcomes: newBucketN,
      avgValueChange: newBucketAvg,
      survivalRate: newBucketSurvived / newBucketN
    })
  } else {
    updatedStats.byValueBucket.set(bucket, {
      bucket,
      outcomes: 1,
      avgValueChange: outcome.ratValueChange,
      medianValueChange: outcome.ratValueChange,
      stdDevValueChange: 0,
      survivalRate: outcome.survived ? 1 : 0,
      avgValueGainOnSurvival: outcome.survived ? outcome.ratValueChange : 0,
      avgValueLossOnDeath: outcome.died ? outcome.ratValueChange : 0
    })
  }

  // Item influence and awards would need more complex incremental updates
  // For now, we mark them as potentially stale and do full recalc periodically

  return updatedStats
}

// =============================================================================
// EXPORTS
// =============================================================================

export { getValueBucket, median, stdDev }
