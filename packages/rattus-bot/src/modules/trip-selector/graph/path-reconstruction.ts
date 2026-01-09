/**
 * ========================================
 * Path Reconstruction
 * ========================================
 *
 * Reconstructs individual rat journeys from historical outcomes to:
 * - Identify successful path patterns
 * - Track item acquisition sequences
 * - Find optimal entry points and progressions
 * - Learn which item combinations lead to success
 */

import type { ExtendedOutcome, RatJourney, JourneyStep, PathPattern, ItemInfo } from "./types"

// =============================================================================
// JOURNEY RECONSTRUCTION
// =============================================================================

/**
 * Reconstruct all rat journeys from historical outcomes
 */
export function reconstructJourneys(outcomes: ExtendedOutcome[]): RatJourney[] {
  // Group outcomes by rat
  const outcomesByRat = new Map<string, ExtendedOutcome[]>()
  for (const outcome of outcomes) {
    const existing = outcomesByRat.get(outcome.ratId) || []
    existing.push(outcome)
    outcomesByRat.set(outcome.ratId, existing)
  }

  const journeys: RatJourney[] = []

  for (const [ratId, ratOutcomes] of outcomesByRat) {
    // Sort by creation date to get chronological order
    const sorted = [...ratOutcomes].sort(
      (a, b) => new Date(a._createdAt).getTime() - new Date(b._createdAt).getTime()
    )

    const journey = buildJourney(ratId, sorted)
    if (journey.steps.length > 0) {
      journeys.push(journey)
    }
  }

  return journeys
}

function buildJourney(ratId: string, sortedOutcomes: ExtendedOutcome[]): RatJourney {
  const steps: JourneyStep[] = []
  let peakValue = 0
  let peakValueStep = 0
  const uniqueItems = new Set<string>()

  for (let i = 0; i < sortedOutcomes.length; i++) {
    const outcome = sortedOutcomes[i]
    const died = outcome.newRatBalance === 0 && outcome.oldRatBalance > 0
    const survived = !died

    // Track items
    const itemsOnEntrance: ItemInfo[] = (outcome.inventoryOnEntrance || []).map(item => ({
      id: item.id || "",
      name: item.name || "",
      value: item.value || 0
    }))

    const itemsGained: ItemInfo[] = (outcome.itemChanges || [])
      .filter(c => c.type === "gained")
      .map(c => ({
        id: c.id || "",
        name: c.name || "",
        value: c.value || 0
      }))

    const itemsLost: ItemInfo[] = died
      ? (outcome.itemsLostOnDeath || []).map(item => ({
          id: item.id || "",
          name: item.name || "",
          value: item.value || 0
        }))
      : (outcome.itemChanges || [])
          .filter(c => c.type === "lost")
          .map(c => ({
            id: c.id || "",
            name: c.name || "",
            value: c.value || 0
          }))

    // Track unique items collected
    for (const item of itemsGained) {
      if (item.name) uniqueItems.add(item.name)
    }

    const step: JourneyStep = {
      tripId: outcome.tripId,
      tripPrompt: "", // We don't have this in outcomes, will be enriched later
      valueChange: outcome.ratValueChange,
      valueBefore: outcome.oldRatValue || 0,
      valueAfter: outcome.ratValue || 0,
      survived,
      itemsOnEntrance,
      itemsGained,
      itemsLost
    }

    steps.push(step)

    // Track peak value
    if (step.valueAfter > peakValue) {
      peakValue = step.valueAfter
      peakValueStep = i
    }

    // If rat died, this is the end of its journey
    if (died) {
      break
    }
  }

  const firstOutcome = sortedOutcomes[0]
  const lastStep = steps[steps.length - 1]

  return {
    ratId,
    ratName: firstOutcome?.ratName || "",
    playerId: firstOutcome?.playerId || "",
    steps,
    totalTrips: steps.length,
    totalValueGained: steps.reduce((sum, s) => sum + s.valueChange, 0),
    finalValue: lastStep?.valueAfter || 0,
    survived: lastStep?.survived ?? false,
    peakValue,
    peakValueStep,
    uniqueItemsCollected: Array.from(uniqueItems)
  }
}

// =============================================================================
// SUCCESS CRITERIA
// =============================================================================

interface SuccessCriteria {
  minTrips: number
  minTotalValueGain: number
  minFinalValue: number
  mustSurvive: boolean
}

const DEFAULT_SUCCESS_CRITERIA: SuccessCriteria = {
  minTrips: 3,
  minTotalValueGain: 500,
  minFinalValue: 1000,
  mustSurvive: false // Even dead rats can have successful paths up to a point
}

/**
 * Filter for successful journeys based on criteria
 */
export function filterSuccessfulJourneys(
  journeys: RatJourney[],
  criteria: Partial<SuccessCriteria> = {}
): RatJourney[] {
  const c = { ...DEFAULT_SUCCESS_CRITERIA, ...criteria }

  return journeys.filter(journey => {
    if (journey.totalTrips < c.minTrips) return false
    if (journey.totalValueGained < c.minTotalValueGain) return false
    if (journey.peakValue < c.minFinalValue) return false
    if (c.mustSurvive && !journey.survived) return false
    return true
  })
}

// =============================================================================
// PATH PATTERN EXTRACTION
// =============================================================================

/**
 * Extract common path patterns from successful journeys
 */
export function extractPathPatterns(
  journeys: RatJourney[],
  minOccurrences: number = 3,
  maxPatternLength: number = 5
): PathPattern[] {
  const patterns: PathPattern[] = []

  // Extract subsequences of various lengths
  for (let length = 2; length <= maxPatternLength; length++) {
    const subsequenceCounts = new Map<
      string,
      {
        tripSequence: string[]
        journeys: RatJourney[]
        totalValueGains: number[]
        completionCount: number
      }
    >()

    for (const journey of journeys) {
      // Extract all subsequences of this length from the journey
      for (let start = 0; start <= journey.steps.length - length; start++) {
        const subsequence = journey.steps.slice(start, start + length)
        const tripIds = subsequence.map(s => s.tripId)
        const key = tripIds.join("->")

        // Calculate value gain for this subsequence
        const valueGain = subsequence.reduce((sum, s) => sum + s.valueChange, 0)

        // Check if the rat completed this subsequence (survived through it)
        const completed = subsequence.every((s, i) => i === subsequence.length - 1 || s.survived)

        const existing = subsequenceCounts.get(key) || {
          tripSequence: tripIds,
          journeys: [],
          totalValueGains: [],
          completionCount: 0
        }
        existing.journeys.push(journey)
        existing.totalValueGains.push(valueGain)
        if (completed) existing.completionCount++
        subsequenceCounts.set(key, existing)
      }
    }

    // Convert to patterns
    for (const [, data] of subsequenceCounts) {
      if (data.journeys.length < minOccurrences) continue

      const avgTotalValueGain =
        data.totalValueGains.reduce((a, b) => a + b, 0) / data.totalValueGains.length
      const completionRate = data.completionCount / data.journeys.length

      // Find key items for this pattern
      const keyItems = findKeyItemsForPattern(data.journeys, data.tripSequence)

      // Find optimal entry value range
      const entryValues = data.journeys.map(j => {
        const startStep = j.steps.find(s => s.tripId === data.tripSequence[0])
        return startStep?.valueBefore || 0
      })
      const optimalRange = findOptimalValueRange(entryValues, data.totalValueGains)

      patterns.push({
        tripSequence: data.tripSequence,
        occurrences: data.journeys.length,
        avgTotalValueGain,
        completionRate,
        keyItems,
        optimalEntryValueRange: optimalRange
      })
    }
  }

  // Sort by a combination of occurrence frequency and value gain
  return patterns
    .filter(p => p.completionRate > 0.3) // At least 30% completion rate
    .sort((a, b) => {
      const scoreA = a.avgTotalValueGain * a.completionRate * Math.log(a.occurrences + 1)
      const scoreB = b.avgTotalValueGain * b.completionRate * Math.log(b.occurrences + 1)
      return scoreB - scoreA
    })
    .slice(0, 50) // Keep top 50 patterns
}

/**
 * Find items that were commonly present during successful execution of a pattern
 */
function findKeyItemsForPattern(
  journeys: RatJourney[],
  tripSequence: string[]
): PathPattern["keyItems"] {
  // Track item presence at each step
  const itemAtStep = new Map<string, Map<number, number>>() // itemName -> step -> count

  for (const journey of journeys) {
    // Find where this pattern occurs in the journey
    const patternStart = findPatternStart(journey.steps, tripSequence)
    if (patternStart === -1) continue

    // Track items at each step of the pattern
    for (let i = 0; i < tripSequence.length; i++) {
      const step = journey.steps[patternStart + i]
      if (!step) continue

      for (const item of step.itemsOnEntrance) {
        if (!item.name) continue
        const itemSteps = itemAtStep.get(item.name) || new Map()
        itemSteps.set(i, (itemSteps.get(i) || 0) + 1)
        itemAtStep.set(item.name, itemSteps)
      }
    }
  }

  // Find items that appear frequently at specific steps
  const keyItems: PathPattern["keyItems"] = []

  for (const [itemName, stepCounts] of itemAtStep) {
    // Find the step where this item is most important
    let maxStep = 0
    let maxCount = 0
    for (const [step, count] of stepCounts) {
      if (count > maxCount) {
        maxCount = count
        maxStep = step
      }
    }

    const frequency = maxCount / journeys.length
    if (frequency > 0.3) {
      // Item present in 30%+ of journeys at this step
      keyItems.push({
        itemName,
        acquiredAtStep: maxStep,
        importanceScore: frequency
      })
    }
  }

  return keyItems.sort((a, b) => b.importanceScore - a.importanceScore).slice(0, 5) // Top 5 key items
}

function findPatternStart(steps: JourneyStep[], tripSequence: string[]): number {
  for (let i = 0; i <= steps.length - tripSequence.length; i++) {
    let matches = true
    for (let j = 0; j < tripSequence.length; j++) {
      if (steps[i + j].tripId !== tripSequence[j]) {
        matches = false
        break
      }
    }
    if (matches) return i
  }
  return -1
}

/**
 * Find the optimal entry value range for a pattern
 */
function findOptimalValueRange(
  entryValues: number[],
  valueGains: number[]
): { min: number; max: number } {
  if (entryValues.length === 0) {
    return { min: 0, max: Infinity }
  }

  // Pair entry values with outcomes and sort
  const pairs = entryValues.map((v, i) => ({ entry: v, gain: valueGains[i] }))
  pairs.sort((a, b) => a.entry - b.entry)

  // Find the range with best average outcome
  // Use a sliding window approach
  const windowSize = Math.max(3, Math.floor(pairs.length / 3))
  let bestAvg = -Infinity
  let bestMin = 0
  let bestMax = Infinity

  for (let i = 0; i <= pairs.length - windowSize; i++) {
    const window = pairs.slice(i, i + windowSize)
    const avgGain = window.reduce((sum, p) => sum + p.gain, 0) / windowSize

    if (avgGain > bestAvg) {
      bestAvg = avgGain
      bestMin = window[0].entry
      bestMax = window[window.length - 1].entry
    }
  }

  // Add some padding to the range
  const range = bestMax - bestMin
  return {
    min: Math.max(0, bestMin - range * 0.1),
    max: bestMax + range * 0.1
  }
}

// =============================================================================
// ITEM ACQUISITION CHAINS
// =============================================================================

export interface ItemChain {
  items: string[] // Sequence of items acquired
  trips: string[] // Trips where they were acquired
  frequency: number
  avgFinalValue: number
}

/**
 * Find common item acquisition chains that lead to success
 */
export function findItemAcquisitionChains(
  journeys: RatJourney[],
  minOccurrences: number = 3
): ItemChain[] {
  const chainCounts = new Map<
    string,
    {
      items: string[]
      trips: string[]
      count: number
      finalValues: number[]
    }
  >()

  for (const journey of journeys) {
    // Build the item chain for this journey
    const itemSequence: Array<{ item: string; trip: string }> = []

    for (const step of journey.steps) {
      for (const item of step.itemsGained) {
        if (item.name) {
          itemSequence.push({ item: item.name, trip: step.tripId })
        }
      }
    }

    // Extract subsequences of the item chain
    for (let length = 2; length <= Math.min(5, itemSequence.length); length++) {
      for (let start = 0; start <= itemSequence.length - length; start++) {
        const subseq = itemSequence.slice(start, start + length)
        const key = subseq.map(s => s.item).join("->")

        const existing = chainCounts.get(key) || {
          items: subseq.map(s => s.item),
          trips: subseq.map(s => s.trip),
          count: 0,
          finalValues: []
        }
        existing.count++
        existing.finalValues.push(journey.peakValue)
        chainCounts.set(key, existing)
      }
    }
  }

  const chains: ItemChain[] = []

  for (const [, data] of chainCounts) {
    if (data.count < minOccurrences) continue

    chains.push({
      items: data.items,
      trips: data.trips,
      frequency: data.count / journeys.length,
      avgFinalValue: data.finalValues.reduce((a, b) => a + b, 0) / data.finalValues.length
    })
  }

  return chains
    .sort((a, b) => b.avgFinalValue * b.frequency - a.avgFinalValue * a.frequency)
    .slice(0, 30)
}

// =============================================================================
// JOURNEY SIMILARITY
// =============================================================================

/**
 * Find journeys similar to the current rat's path
 * Useful for predicting what trips to take next based on similar successful rats
 */
export function findSimilarJourneys(
  currentPath: string[], // Trip IDs taken so far
  currentItems: string[], // Items currently held
  journeys: RatJourney[],
  topN: number = 10
): Array<{ journey: RatJourney; similarity: number; nextTrips: string[] }> {
  const results: Array<{ journey: RatJourney; similarity: number; nextTrips: string[] }> = []

  for (const journey of journeys) {
    // Calculate path similarity
    const journeyTripIds = journey.steps.map(s => s.tripId)
    const pathSimilarity = calculateSequenceSimilarity(currentPath, journeyTripIds)

    // Calculate item similarity at the matching point
    const matchPoint = findBestMatchPoint(currentPath, journeyTripIds)
    if (matchPoint === -1) continue

    const itemsAtMatchPoint = journey.steps[matchPoint]?.itemsOnEntrance.map(i => i.name) || []
    const itemSimilarity = calculateSetSimilarity(currentItems, itemsAtMatchPoint)

    // Combined similarity
    const similarity = pathSimilarity * 0.6 + itemSimilarity * 0.4

    // Get next trips from this journey
    const nextTrips = journeyTripIds.slice(matchPoint + 1, matchPoint + 4) // Next 3 trips

    if (nextTrips.length > 0 && similarity > 0.3) {
      results.push({ journey, similarity, nextTrips })
    }
  }

  return results.sort((a, b) => b.similarity - a.similarity).slice(0, topN)
}

function calculateSequenceSimilarity(seq1: string[], seq2: string[]): number {
  if (seq1.length === 0 || seq2.length === 0) return 0

  // Find longest common subsequence length
  const m = seq1.length
  const n = seq2.length
  const dp: number[][] = Array(m + 1)
    .fill(null)
    .map(() => Array(n + 1).fill(0))

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (seq1[i - 1] === seq2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1])
      }
    }
  }

  const lcsLength = dp[m][n]
  return (2 * lcsLength) / (m + n)
}

function calculateSetSimilarity(set1: string[], set2: string[]): number {
  if (set1.length === 0 && set2.length === 0) return 1
  if (set1.length === 0 || set2.length === 0) return 0

  const s1 = new Set(set1)
  const s2 = new Set(set2)

  let intersection = 0
  for (const item of s1) {
    if (s2.has(item)) intersection++
  }

  const union = new Set([...set1, ...set2]).size
  return intersection / union // Jaccard similarity
}

function findBestMatchPoint(currentPath: string[], journeyPath: string[]): number {
  // Find where current path best aligns with journey path
  // Return the index in journey path that corresponds to current position

  if (currentPath.length === 0) return -1

  let bestMatch = -1
  let bestScore = 0

  for (let i = 0; i < journeyPath.length; i++) {
    // Check how many of the last N trips match
    let matchScore = 0
    for (let j = 0; j < currentPath.length && i - j >= 0; j++) {
      if (journeyPath[i - j] === currentPath[currentPath.length - 1 - j]) {
        matchScore++
      }
    }

    if (matchScore > bestScore) {
      bestScore = matchScore
      bestMatch = i
    }
  }

  return bestMatch
}
