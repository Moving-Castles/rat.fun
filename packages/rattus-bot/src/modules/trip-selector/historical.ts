import Anthropic from "@anthropic-ai/sdk"
import type { Trip, TripSelectionResult, Rat } from "../../types"
import { getAllOutcomesForWorld, type Outcome } from "../cms"
import type { InventoryItem } from "./claude"

interface TripStats {
  trip: Trip
  outcomes: number
  survivals: number     // non-death outcomes
  wins: number          // positive ratValueChange count (excluding deaths)
  losses: number        // negative ratValueChange count (excluding deaths)
  zeros: number         // zero ratValueChange count
  deaths: number        // newRatBalance = 0
  survivalValue: number // sum of ratValueChange for non-death outcomes only
  survivalEv: number    // expected value when surviving = survivalValue / survivals
  winRate: number       // wins / survivals
  deathRate: number     // deaths / outcomes
  activeRate: number    // (wins + losses) / survivals (how often something happens when surviving)
  score: number         // composite score for ranking
}

/**
 * Calculate composite score for a trip
 *
 * Score = survivalEv × (1 - deathRate) × activeRate
 *
 * - survivalEv: expected value when you survive (excludes death losses)
 * - (1 - deathRate): probability of surviving
 * - activeRate: penalize trips where nothing happens (zeros waste time)
 */
function calculateScore(stats: TripStats): number {
  if (stats.survivals === 0) return -Infinity

  return stats.survivalEv * (1 - stats.deathRate) * stats.activeRate
}

/**
 * Use Claude to select the best trip from a shortlist based on inventory
 */
async function selectWithClaude(
  anthropic: Anthropic,
  candidates: TripStats[],
  rat: Rat,
  inventoryDetails: InventoryItem[]
): Promise<{ selected: TripStats; reasoning: string } | null> {
  if (candidates.length === 0) return null
  if (candidates.length === 1) {
    return { selected: candidates[0], reasoning: "Only one candidate" }
  }

  const totalInventoryValue = inventoryDetails.reduce((sum, item) => sum + item.value, 0)

  // Build inventory description
  let inventorySection = ""
  if (inventoryDetails.length > 0) {
    const itemsList = inventoryDetails.map(i => `- ${i.name} (value: ${i.value})`).join("\n")
    inventorySection = `
## Current Inventory
The rat is carrying:
${itemsList}
Total inventory value: ${totalInventoryValue}
`
  } else {
    inventorySection = "\n## Current Inventory\nThe rat has no items.\n"
  }

  // Build candidates list with stats
  const candidatesList = candidates.map((c, i) => {
    const survivalPct = (100 - c.deathRate * 100).toFixed(0)
    const evStr = c.survivalEv >= 0 ? `+${c.survivalEv.toFixed(1)}` : c.survivalEv.toFixed(1)
    return `${i + 1}. "${c.trip.prompt}"
   - Trip balance: ${c.trip.balance}
   - Survival rate: ${survivalPct}%
   - Expected value when surviving: ${evStr}
   - Historical outcomes: ${c.outcomes}
   - Score: ${c.score.toFixed(2)}`
  }).join("\n\n")

  const prompt = `You are helping a rat choose the best trip from a pre-filtered shortlist.

## Rat Status
- Name: ${rat.name}
- Balance: ${rat.balance}
- Total value: ${rat.balance + totalInventoryValue}
${inventorySection}
## Candidate Trips (includes all available trips - some may be risky!)
${candidatesList}

## Your Task
Choose the BEST trip considering:
1. Does the rat's inventory match what the trip might need?
2. Which trip prompt suggests the best reward for this rat's situation?
3. Consider trips that might GIVE useful items - items can be used in future trips for bigger gains
4. Higher scores are generally better, but inventory synergy and item acquisition potential matter more
5. Be adventurous - sometimes a lower-scored trip with good item potential is worth it
6. AVOID trips with survival rate below 30% unless the reward potential is exceptional
7. Negative scores indicate historically unprofitable trips - be cautious but not dismissive

Respond with JSON only:
\`\`\`json
{
  "choice": 1,
  "reasoning": "Brief explanation"
}
\`\`\``

  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 200,
      temperature: 1.0,
      messages: [{ role: "user", content: prompt }]
    })

    const content = response.content[0]
    if (content.type !== "text") return null

    // Parse JSON response
    let jsonText = content.text.trim()
    if (jsonText.startsWith("```json")) jsonText = jsonText.slice(7)
    if (jsonText.startsWith("```")) jsonText = jsonText.slice(3)
    if (jsonText.endsWith("```")) jsonText = jsonText.slice(0, -3)

    const parsed = JSON.parse(jsonText.trim())
    const choiceIndex = (parsed.choice || 1) - 1

    if (choiceIndex >= 0 && choiceIndex < candidates.length) {
      return {
        selected: candidates[choiceIndex],
        reasoning: parsed.reasoning || "Claude selection"
      }
    }
  } catch (error) {
    console.warn("[Claude] Failed to select from shortlist:", error)
  }

  return null
}

/**
 * Select the most profitable trip based on historical outcome data
 *
 * Strategy: Maximize expected value while minimizing death risk
 * and avoiding "zero outcome" trips that waste time.
 * Final selection uses Claude to pick best trip based on inventory.
 */
export async function selectTripHistorical(
  trips: Trip[],
  worldAddress: string,
  anthropic?: Anthropic,
  rat?: Rat,
  inventoryDetails: InventoryItem[] = []
): Promise<TripSelectionResult | null> {
  if (trips.length === 0) return null

  // Fetch ALL outcomes for this world from CMS
  const allOutcomes = await getAllOutcomesForWorld(worldAddress)
  console.log(`Fetched ${allOutcomes.length} total outcomes from CMS`)

  // Build lookup set of available trip IDs (lowercase for matching)
  const tripIdSet = new Set(trips.map(t => t.id.toLowerCase()))

  // Filter outcomes: must match available trips and have ratValueChange
  const outcomes = allOutcomes.filter(o =>
    tripIdSet.has(o.tripId.toLowerCase()) &&
    o.ratValueChange !== undefined &&
    o.ratValueChange !== null
  )
  console.log(`${outcomes.length} valid outcomes match ${trips.length} available trips`)

  // Initialize stats for all trips
  const statsByTrip = new Map<string, TripStats>()
  for (const trip of trips) {
    statsByTrip.set(trip.id.toLowerCase(), {
      trip,
      outcomes: 0,
      survivals: 0,
      wins: 0,
      losses: 0,
      zeros: 0,
      deaths: 0,
      survivalValue: 0,
      survivalEv: 0,
      winRate: 0,
      deathRate: 0,
      activeRate: 0,
      score: -Infinity
    })
  }

  // Accumulate outcome data
  for (const outcome of outcomes) {
    const key = outcome.tripId.toLowerCase()
    const stats = statsByTrip.get(key)
    if (!stats) continue

    stats.outcomes++

    // Detect death: balance went to 0 from non-zero
    const isDeath = (outcome.newRatBalance ?? -1) === 0 && (outcome.oldRatBalance ?? 0) > 0

    if (isDeath) {
      stats.deaths++
    } else {
      // Only count non-death outcomes for survival stats
      stats.survivals++
      stats.survivalValue += outcome.ratValueChange!

      // Categorize survival outcome
      if (outcome.ratValueChange! > 0) {
        stats.wins++
      } else if (outcome.ratValueChange! < 0) {
        stats.losses++
      } else {
        stats.zeros++
      }
    }
  }

  // Calculate derived stats and scores
  for (const stats of statsByTrip.values()) {
    if (stats.outcomes > 0) {
      stats.deathRate = stats.deaths / stats.outcomes

      if (stats.survivals > 0) {
        stats.survivalEv = stats.survivalValue / stats.survivals
        stats.winRate = stats.wins / stats.survivals
        stats.activeRate = (stats.wins + stats.losses) / stats.survivals
      }

      stats.score = calculateScore(stats)
    }
  }

  // Get all trips with data
  const allTripsWithData = Array.from(statsByTrip.values())
    .filter(s => s.outcomes >= 1)
    .sort((a, b) => b.score - a.score)

  // Log ALL trips with their scores (score = survivalEv × (1 - deathRate) × activeRate)
  console.log(`\nALL ${allTripsWithData.length} trips with scores (score = survivalEv × (1-deathRate) × activeRate):`)
  allTripsWithData.forEach((s, i) => {
    const evStr = s.survivalEv >= 0 ? `+${s.survivalEv.toFixed(1)}` : s.survivalEv.toFixed(1)
    const deathPct = (s.deathRate * 100).toFixed(0)
    const winPct = (s.winRate * 100).toFixed(0)
    const activePct = (s.activeRate * 100).toFixed(0)
    const survivalPct = (100 - s.deathRate * 100).toFixed(0)
    const tripDesc = s.trip.prompt.slice(0, 20).padEnd(20)
    console.log(`  ${i + 1}. "${tripDesc}" score: ${s.score.toFixed(2)}, survEV: ${evStr}, survival: ${survivalPct}%, active: ${activePct}%, win: ${winPct}%, n=${s.outcomes}`)
  })

  // Filter: score > 0 (profitable) AND survival rate >= 30%
  const validTrips = allTripsWithData.filter(s => s.score > 0 && s.deathRate <= 0.7)

  console.log(`\nValid trips (score > 0, survival >= 30%): ${validTrips.length}`)

  if (validTrips.length === 0) {
    // Fallback: just pick highest score regardless of death rate
    if (allTripsWithData.length > 0) {
      console.log("Using fallback (ignoring death filter)")
      const best = allTripsWithData[0]
      const evStr = best.survivalEv >= 0 ? `+${best.survivalEv.toFixed(1)}` : best.survivalEv.toFixed(1)
      const survivalPct = (100 - best.deathRate * 100).toFixed(0)
      return {
        trip: best.trip,
        explanation: `Fallback: score ${best.score.toFixed(2)}, survEV ${evStr}, ${survivalPct}% survival (${best.outcomes} outcomes)`
      }
    }

    console.log("No trips with data found!")
    return null
  }

  // Include all available trips for Claude to consider
  const candidates = Array.from(statsByTrip.values())
  const poolSource = `all ${candidates.length} available trips`

  let selected: TripStats
  let selectionSource: string

  // Use Claude to select from candidates if available
  if (anthropic && rat && candidates.length > 1) {
    console.log(`[Claude] Selecting from ${candidates.length} candidates...`)
    const claudeResult = await selectWithClaude(anthropic, candidates, rat, inventoryDetails)

    if (claudeResult) {
      selected = claudeResult.selected
      selectionSource = `Claude (${poolSource}): ${claudeResult.reasoning}`
      console.log(`[Claude] Selected: "${selected.trip.prompt.slice(0, 30)}..."`)
    } else {
      // Claude failed, fall back to random
      const randomIndex = Math.floor(Math.random() * candidates.length)
      selected = candidates[randomIndex]
      selectionSource = `random from ${poolSource} (Claude failed)`
    }
  } else {
    // No Claude available, pick randomly from candidates
    const randomIndex = Math.floor(Math.random() * candidates.length)
    selected = candidates[randomIndex]
    selectionSource = `random from ${poolSource}`
  }

  // Build explanation
  const evStr = selected.survivalEv >= 0 ? `+${selected.survivalEv.toFixed(1)}` : selected.survivalEv.toFixed(1)
  const survivalPct = (100 - selected.deathRate * 100).toFixed(0)
  const winPct = (selected.winRate * 100).toFixed(0)
  const explanation = `${selectionSource}: score ${selected.score.toFixed(2)}, survEV ${evStr}, ${winPct}% wins, ${survivalPct}% survival (${selected.outcomes} outcomes)`

  console.log(`Selected via ${selectionSource}`)

  return {
    trip: selected.trip,
    explanation
  }
}
