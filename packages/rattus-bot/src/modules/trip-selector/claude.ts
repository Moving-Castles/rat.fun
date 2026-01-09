import Anthropic from "@anthropic-ai/sdk"
import type { Trip, Rat, TripSelectionResult } from "../../types"
import type { OutcomeWithPrompt } from "../cms"

interface ClaudeResponse {
  tripId: string
  explanation: string
}

export interface InventoryItem {
  name: string
  value: number
}

/**
 * Use Claude to evaluate and select the best trip
 */
export async function selectTripWithClaude(
  anthropic: Anthropic,
  trips: Trip[],
  rat: Rat,
  inventoryDetails: InventoryItem[] = [],
  recentOutcomes: OutcomeWithPrompt[] = []
): Promise<TripSelectionResult | null> {
  if (trips.length === 0) return null

  if (trips.length === 1) {
    return {
      trip: trips[0],
      explanation: "Only one trip available"
    }
  }

  const tripsForPrompt = trips.map(t => {
    // Calculate certainty-weighted survival rate using Bayesian approach
    // With low visit counts, regress toward 50% (uncertain)
    // As visits increase, trust the actual survival rate more
    const priorWeight = 5 // Equivalent to 5 prior visits at 50% survival
    const priorSurvival = priorWeight * 0.5
    const actualSurvival = t.visitCount - t.killCount
    const weightedSurvivalRate = Math.round(
      ((priorSurvival + actualSurvival) / (priorWeight + t.visitCount)) * 100
    )

    return {
      id: t.id,
      prompt: t.prompt,
      balance: t.balance,
      visitCount: t.visitCount,
      killCount: t.killCount,
      survivalRate: weightedSurvivalRate,
      confidence: t.visitCount >= 10 ? "high" : t.visitCount >= 5 ? "medium" : "low"
    }
  })

  // Build inventory section for prompt
  const totalInventoryValue = inventoryDetails.reduce((sum, item) => sum + item.value, 0)
  let inventorySection = ""
  if (inventoryDetails.length > 0) {
    const itemsList = inventoryDetails.map(i => `  - ${i.name} (value: ${i.value})`).join("\n")
    inventorySection = `
## Current Inventory
The rat is carrying the following items (total inventory value: ${totalInventoryValue}):
${itemsList}

IMPORTANT: Consider how these items might interact with trip scenarios:
- Some trips may require specific items to succeed or avoid danger
- Some items may provide advantages in certain situations
- Losing valuable items is a risk - consider if a trip might cause item loss
`
  } else {
    inventorySection = `
## Current Inventory
The rat is not carrying any items.
`
  }

  // Build recent outcomes section
  let outcomesSection = ""
  if (recentOutcomes.length > 0) {
    // Filter to only outcomes for currently available trips
    const availableTripIds = new Set(trips.map(t => t.id))
    const relevantOutcomes = recentOutcomes.filter(o => availableTripIds.has(o.tripId))

    if (relevantOutcomes.length > 0) {
      // Summarize outcomes by trip
      const outcomesByTrip = new Map<
        string,
        { wins: number; deaths: number; totalChange: number; prompt: string }
      >()

      for (const outcome of relevantOutcomes) {
        const existing = outcomesByTrip.get(outcome.tripId) || {
          wins: 0,
          deaths: 0,
          totalChange: 0,
          prompt: outcome.tripPrompt || ""
        }
        const isDeath = (outcome.newRatBalance ?? 0) === 0 && (outcome.oldRatBalance ?? 0) > 0

        if (isDeath) {
          existing.deaths++
        } else {
          existing.wins++
          existing.totalChange += outcome.ratValueChange ?? 0
        }

        outcomesByTrip.set(outcome.tripId, existing)
      }

      const summaries = Array.from(outcomesByTrip.entries()).map(([tripId, stats]) => {
        const avgGain = stats.wins > 0 ? Math.round(stats.totalChange / stats.wins) : 0
        return `- Trip "${stats.prompt.slice(0, 50)}...": ${stats.wins} survivals (avg +${avgGain}), ${stats.deaths} deaths`
      })

      outcomesSection = `
## Recent Outcome History (from other rats)
Here's what happened to other rats in currently available trips (last 50 game-wide outcomes):
${summaries.join("\n")}

Use this data to identify which trips are actually rewarding vs deadly in practice.
`
    }
  }

  const targetValue = 200
  const currentValue = rat.balance + totalInventoryValue
  const valueNeeded = Math.max(0, targetValue - currentValue)

  const prompt = `You are an AI strategist helping a rat named "${rat.name}" choose which trip to enter in a game.

## Primary Goal
Your goal is to reach ${targetValue} TOTAL VALUE as quickly as possible so the rat can be liquidated for profit. Current value: ${currentValue}. You need ${valueNeeded} more value to reach the target.

IMPORTANT MINDSET: You have an APPETITE FOR RISK. Mere survival is NOT desirable - a rat that survives but gains nothing is wasting time. You'd rather take calculated risks for high rewards than play it safe. Death is acceptable if the potential reward justified the risk.

## Risk Philosophy
- HIGH reward trips are preferred even if they have moderate danger
- Playing it safe with low-reward trips is a LOSING strategy
- The goal is to GROW value fast, not to survive the longest
- A 60% survival rate with +20 value potential beats a 90% survival rate with +5 value potential
- Time is money - slow safe gains mean more exposure to eventual death anyway

## Current Rat State
- Balance: ${rat.balance} credits
- Items in inventory: ${rat.inventory.length} (total inventory value: ${totalInventoryValue})
- Total value: ${currentValue} / ${targetValue} target
- Progress: ${Math.round((currentValue / targetValue) * 100)}% to liquidation goal
- Total trips survived: ${rat.tripCount}
${inventorySection}${outcomesSection}
## Available Trips
${JSON.stringify(tripsForPrompt, null, 2)}

## Your Task
Analyze each trip to find the BEST VALUE OPPORTUNITY. Consider:
1. Which trip offers the HIGHEST potential value gain? Prioritize trips with high balance pools.
2. Does the trip prompt suggest treasure, loot, rewards, or valuable items? These are attractive.
3. Accept moderate risk (40-70% survival) if the reward potential is high.
4. Only avoid trips that seem like death traps with NO reward (high danger + no loot mentioned).
5. Consider if your inventory items give advantages or are required for certain trips.
6. Use trip statistics AND recent outcome history to assess real-world performance:
   - Recent outcomes show actual results from other rats - this is valuable data
   - Trips with good avg gains and low death rates are proven winners
   - Be wary of trips where recent rats died frequently
7. Use the survivalRate statistic as a guide, but weigh recent outcomes more heavily:
   - survivalRate below 30% with recent deaths = avoid
   - survivalRate 40-60% with good recent gains = worth the risk
   - survivalRate above 70% = safe, but make sure the reward is worth it

## Response Format
Respond with a JSON object containing:
- tripId: The full ID of your chosen trip
- explanation: A brief (1-2 sentence) explanation of why you chose this trip

Example:
\`\`\`json
{
  "tripId": "0x1234...",
  "explanation": "High balance pool with treasure mentioned in prompt - worth the 55% survival odds for potential +25 value."
}
\`\`\`

Respond with ONLY the JSON object, no other text.`

  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 300,
      messages: [{ role: "user", content: prompt }]
    })

    const content = response.content[0]
    if (content.type !== "text") {
      console.warn("Unexpected response type from Claude, falling back to heuristic")
      return fallbackSelection(trips)
    }

    // Parse JSON response
    let parsed: ClaudeResponse
    try {
      // Extract JSON from response (handle markdown code blocks)
      let jsonText = content.text.trim()
      if (jsonText.startsWith("```json")) {
        jsonText = jsonText.slice(7)
      }
      if (jsonText.startsWith("```")) {
        jsonText = jsonText.slice(3)
      }
      if (jsonText.endsWith("```")) {
        jsonText = jsonText.slice(0, -3)
      }
      parsed = JSON.parse(jsonText.trim())
    } catch {
      console.warn("Failed to parse Claude response as JSON:", content.text)
      return fallbackSelection(trips)
    }

    // Find the trip with this ID
    const selectedTrip = trips.find(t => t.id === parsed.tripId)

    if (!selectedTrip) {
      console.warn(`Claude selected unknown trip ID: ${parsed.tripId}, falling back to heuristic`)
      return fallbackSelection(trips)
    }

    return {
      trip: selectedTrip,
      explanation: parsed.explanation
    }
  } catch (error) {
    console.error("Error calling Claude API:", error)
    console.warn("Falling back to heuristic selection")
    return fallbackSelection(trips)
  }
}

function fallbackSelection(trips: Trip[]): TripSelectionResult {
  const trip = trips.sort((a, b) => b.balance - a.balance)[0]
  return {
    trip,
    explanation: "Fallback: selected trip with highest balance"
  }
}
