import Anthropic from "@anthropic-ai/sdk"
import type { Trip, TripSelectionResult, Rat } from "../../types"
import type { InventoryItem } from "./claude"

/**
 * Scalper state - tracks current trip and profitability
 */
interface ScalperState {
  currentTripId: string | null
  currentTripPrompt: string | null
  lastValueChange: number | null
  lastOutcomeLog: string[] | null
  unprofitableTrips: Set<string>
}

// Module-level state for scalper strategy
const state: ScalperState = {
  currentTripId: null,
  currentTripPrompt: null,
  lastValueChange: null,
  lastOutcomeLog: null,
  unprofitableTrips: new Set()
}

/**
 * Update scalper state after a trip outcome
 * Call this from bot.ts after each trip to track profitability
 */
export function updateScalperState(
  tripId: string,
  tripPrompt: string,
  valueChange: number,
  outcomeLog: string[]
): void {
  state.currentTripId = tripId
  state.currentTripPrompt = tripPrompt
  state.lastValueChange = valueChange
  state.lastOutcomeLog = outcomeLog

  // Track unprofitable trips to avoid retrying them
  if (valueChange <= 0) {
    state.unprofitableTrips.add(tripId)
    console.log(`[Scalper] Marked trip as unprofitable (${state.unprofitableTrips.size} total blacklisted)`)
  }

  console.log(`[Scalper] Updated state: trip=${tripId.slice(0, 10)}..., valueChange=${valueChange}`)
}

/**
 * Reset scalper state (e.g., when rat dies)
 */
export function resetScalperState(): void {
  state.currentTripId = null
  state.currentTripPrompt = null
  state.lastValueChange = null
  state.lastOutcomeLog = null
  state.unprofitableTrips.clear()
  console.log("[Scalper] State reset (cleared unprofitable trips list)")
}

/**
 * Get current scalper state (for debugging)
 */
export function getScalperState(): ScalperState {
  return { ...state }
}

/**
 * Use Claude to select the best trip from new trips
 */
async function selectWithClaude(
  anthropic: Anthropic,
  trips: Trip[],
  rat: Rat,
  inventoryDetails: InventoryItem[]
): Promise<{ selected: Trip; reasoning: string } | null> {
  if (trips.length === 0) return null
  if (trips.length === 1) {
    return { selected: trips[0], reasoning: "Only one new trip available" }
  }

  const totalInventoryValue = inventoryDetails.reduce((sum, item) => sum + item.value, 0)

  // Build inventory description
  let inventorySection = ""
  if (inventoryDetails.length > 0) {
    const itemsList = inventoryDetails.map(i => `- ${i.name} (value: ${i.value})`).join("\n")
    inventorySection = `
## Current Inventory (${inventoryDetails.length} items)
${itemsList}
Total inventory value: ${totalInventoryValue}
`
  } else {
    inventorySection = `
## Current Inventory
**EMPTY** - The rat has no items.
`
  }

  // Build last outcome section
  let lastOutcomeSection = ""
  if (state.lastOutcomeLog && state.lastOutcomeLog.length > 0 && state.currentTripPrompt) {
    const outcomeText = state.lastOutcomeLog.join("\n")
    const profitStatus = state.lastValueChange !== null
      ? (state.lastValueChange > 0 ? `+${state.lastValueChange} (profitable)` : `${state.lastValueChange} (not profitable)`)
      : "unknown"
    lastOutcomeSection = `
## Last Trip Outcome
**Trip:** "${state.currentTripPrompt}"
**Result:** ${profitStatus}
**Log:**
${outcomeText}
`
  }

  // Build trip list
  const tripsList = trips
    .map((t, i) => {
      return `${i + 1}. "${t.prompt}"
   - Balance: ${t.balance}
   - Visit count: ${t.visitCount}
   - Kill count: ${t.killCount}`
    })
    .join("\n\n")

  const prompt = `You are helping a rat choose the best trip to scalp.

## Strategy: Scalping Newest Trips
You're targeting the newest trips. The goal is to find underexplored opportunities before other players discover them.
${lastOutcomeSection}
## Rat Status
- Name: ${rat.name}
- Balance: ${rat.balance}
- Total value: ${rat.balance + totalInventoryValue}
${inventorySection}
## Available Trips (${trips.length} newest trips)
${tripsList}

## Selection Criteria
1. **Low visit/kill counts are good** - Less explored means more potential
2. **Higher balance is attractive** - More rewards available
3. **Read the prompt carefully** - Avoid obvious death traps
4. **Match inventory to trip theme** - Use items you have for advantage
5. **Avoid gambling/chance trips** - Pure luck doesn't benefit from strategy

## Response
Choose the best trip for scalping.

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

    if (choiceIndex >= 0 && choiceIndex < trips.length) {
      return {
        selected: trips[choiceIndex],
        reasoning: parsed.reasoning || "Claude selection"
      }
    }
  } catch (error) {
    console.warn("[Scalper] Claude selection failed:", error)
  }

  return null
}

export interface ScalperOptions {
  trips: Trip[]
  currentBlockNumber: number
  anthropic: Anthropic
  rat: Rat
  inventoryDetails?: InventoryItem[]
  newestCount?: number
}

/**
 * Scalper strategy: target the newest trips by creation block
 *
 * Logic:
 * 1. Sort trips by creationBlock descending (newest first)
 * 2. Take the top N newest trips (default: 10)
 * 3. If we have a current profitable trip that's still in the pool, stick with it
 * 4. Otherwise, use Claude to pick the best new trip
 */
export async function selectTripScalper(
  options: ScalperOptions
): Promise<TripSelectionResult | null> {
  const {
    trips,
    currentBlockNumber,
    anthropic,
    rat,
    inventoryDetails = [],
    newestCount = 10
  } = options

  if (trips.length === 0) return null

  // Sort by creationBlock descending (newest first) and take top N
  const sortedByCreation = [...trips].sort((a, b) => b.creationBlock - a.creationBlock)
  const newestTrips = sortedByCreation.slice(0, newestCount)

  // Filter out previously unprofitable trips
  const eligibleTrips = newestTrips.filter(t => !state.unprofitableTrips.has(t.id))

  if (state.unprofitableTrips.size > 0) {
    console.log(`[Scalper] Excluding ${newestTrips.length - eligibleTrips.length} unprofitable trips`)
  }

  if (eligibleTrips.length === 0) {
    console.log("[Scalper] All newest trips are blacklisted, no eligible trips")
    return null
  }

  console.log(`[Scalper] Selecting from ${eligibleTrips.length} eligible trips (of ${trips.length} total):`)
  eligibleTrips.forEach(t => {
    const ageBlocks = currentBlockNumber - t.creationBlock
    const ageMinutes = Math.round((ageBlocks * 2) / 60)
    console.log(
      `  - "${t.prompt.slice(0, 30)}..." (${ageMinutes}m old, ${t.visitCount} visits, balance: ${t.balance})`
    )
  })

  // Check if current trip is still in the eligible pool and was profitable
  if (state.currentTripId !== null && state.lastValueChange !== null && state.lastValueChange > 0) {
    const currentTrip = eligibleTrips.find(t => t.id === state.currentTripId)
    if (currentTrip) {
      console.log(
        `[Scalper] Sticking with profitable trip: "${currentTrip.prompt.slice(0, 30)}..." (last: +${state.lastValueChange})`
      )
      return {
        trip: currentTrip,
        explanation: `Scalper: continuing profitable trip (last: +${state.lastValueChange})`
      }
    }
    console.log("[Scalper] Previous trip no longer in eligible pool, selecting new")
  } else if (state.currentTripId !== null && state.lastValueChange !== null) {
    console.log(`[Scalper] Previous trip was not profitable (${state.lastValueChange}), switching`)
  }

  // Use Claude to select from eligible trips
  console.log(`[Scalper] Asking Claude to select from ${eligibleTrips.length} eligible trips...`)
  const claudeResult = await selectWithClaude(anthropic, eligibleTrips, rat, inventoryDetails)

  if (claudeResult) {
    const { selected, reasoning } = claudeResult
    state.currentTripId = selected.id
    state.lastValueChange = null

    const ageBlocks = currentBlockNumber - selected.creationBlock
    const ageMinutes = Math.round((ageBlocks * 2) / 60)

    console.log(`[Scalper] Claude selected: "${selected.prompt.slice(0, 30)}..."`)
    return {
      trip: selected,
      explanation: `Scalper (Claude): ${reasoning} (${ageMinutes}m old, ${selected.visitCount} visits)`
    }
  }

  // Fallback: pick randomly if Claude fails
  console.log("[Scalper] Claude failed, falling back to random selection")
  const randomIndex = Math.floor(Math.random() * eligibleTrips.length)
  const selected = eligibleTrips[randomIndex]

  state.currentTripId = selected.id
  state.lastValueChange = null

  return {
    trip: selected,
    explanation: `Scalper (random fallback): ${selected.visitCount} visits, balance ${selected.balance}`
  }
}
