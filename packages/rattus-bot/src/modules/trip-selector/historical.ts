import type { Trip, TripSelectionResult } from "../../types"
import { getOutcomesForTrips, type Outcome } from "../cms"

interface TripStats {
  tripId: string
  trip: Trip
  totalOutcomes: number
  avgValueChange: number
  totalValueChange: number
  survivalRate: number
  deaths: number
}

/**
 * Calculate statistics for each trip based on historical outcomes
 */
function calculateTripStats(trips: Trip[], outcomes: Outcome[]): TripStats[] {
  const outcomesByTrip = new Map<string, Outcome[]>()

  // Group outcomes by trip
  for (const outcome of outcomes) {
    const existing = outcomesByTrip.get(outcome.tripId) || []
    existing.push(outcome)
    outcomesByTrip.set(outcome.tripId, existing)
  }

  return trips.map(trip => {
    const tripOutcomes = outcomesByTrip.get(trip.id) || []
    const totalOutcomes = tripOutcomes.length

    if (totalOutcomes === 0) {
      return {
        tripId: trip.id,
        trip,
        totalOutcomes: 0,
        avgValueChange: 0,
        totalValueChange: 0,
        survivalRate: 0.5, // Unknown, assume 50%
        deaths: 0
      }
    }

    const totalValueChange = tripOutcomes.reduce((sum, o) => sum + (o.ratValueChange ?? 0), 0)
    const avgValueChange = totalValueChange / totalOutcomes

    // Death is when newRatBalance becomes 0 (and wasn't 0 before)
    const deaths = tripOutcomes.filter(
      o => (o.newRatBalance ?? 0) === 0 && (o.oldRatBalance ?? 0) > 0
    ).length
    const survivalRate = (totalOutcomes - deaths) / totalOutcomes

    return {
      tripId: trip.id,
      trip,
      totalOutcomes,
      avgValueChange,
      totalValueChange,
      survivalRate,
      deaths
    }
  })
}

/**
 * Score a trip based on historical data
 * Higher score = better trip to enter
 *
 * We use avgValueChange directly since death outcomes (large negative values)
 * are already reflected in the average.
 */
function scoreTrip(stats: TripStats): number {
  // If no historical data, use a neutral score based on trip balance
  if (stats.totalOutcomes === 0) {
    // Unknown trips get a small positive score based on their balance
    // This encourages exploration but with lower priority than known good trips
    return stats.trip.balance * 0.1
  }

  // Add a small bonus for having more data (more confident in the estimate)
  const confidenceBonus = Math.min(stats.totalOutcomes / 20, 1) * 10

  return stats.avgValueChange + confidenceBonus
}

/**
 * Select the best trip based on historical outcome data from the CMS
 */
export async function selectTripHistorical(
  trips: Trip[],
  worldAddress: string
): Promise<TripSelectionResult | null> {
  if (trips.length === 0) return null

  // Fetch all outcomes for these trips from the CMS
  const tripIds = trips.map(t => t.id)
  const outcomes = await getOutcomesForTrips(tripIds, worldAddress)

  // Calculate stats for each trip
  const stats = calculateTripStats(trips, outcomes)

  // Score each trip and find the best one
  const scoredTrips = stats.map(s => ({
    stats: s,
    score: scoreTrip(s)
  }))

  // Sort by score descending
  scoredTrips.sort((a, b) => b.score - a.score)

  const best = scoredTrips[0]
  if (!best) return null

  // Build explanation
  let explanation: string
  if (best.stats.totalOutcomes === 0) {
    explanation = `No historical data, selected based on trip balance (${best.stats.trip.balance})`
  } else {
    const avgStr =
      best.stats.avgValueChange >= 0
        ? `+${best.stats.avgValueChange.toFixed(1)}`
        : best.stats.avgValueChange.toFixed(1)
    const survivalPct = (best.stats.survivalRate * 100).toFixed(0)
    explanation = `Best historical performance: avg ${avgStr} value change, ${survivalPct}% survival rate (${best.stats.totalOutcomes} outcomes)`
  }

  return {
    trip: best.stats.trip,
    explanation
  }
}
