import Anthropic from "@anthropic-ai/sdk"
import type { Trip, Rat, TripOutcomeHistory, TripSelectionResult } from "../../types"

interface ClaudeResponse {
  tripId: string
  explanation: string
}

/**
 * Use Claude to evaluate and select the best trip
 */
export async function selectTripWithClaude(
  anthropic: Anthropic,
  trips: Trip[],
  rat: Rat,
  outcomeHistory: TripOutcomeHistory[] = []
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

  let historySection = ""
  if (outcomeHistory.length > 0) {
    // Filter history to only include outcomes for currently available trips
    const availableTripIds = new Set(trips.map(t => t.id))
    const relevantHistory = outcomeHistory.filter(h => availableTripIds.has(h.tripId)).slice(-10)

    if (relevantHistory.length > 0) {
      historySection = `
## Previous Trip Outcomes (for learning)
Here are the outcomes of recent trips this rat has taken on currently available trips. Use this to inform your strategy:
${JSON.stringify(relevantHistory, null, 2)}

Note: valueChange represents the change in TOTAL VALUE (balance + inventory items). This is the key success metric.

Analyze patterns:
– If rat died or lost a lot of value in a trip, do not re-enter unless there is very clear ground to assume the outcome will be different this time.
- Which types of trip prompts led to positive vs negative valueChange?
- How do items gained/lost affect total value?
- What scenarios were dangerous (led to death or large value losses)?
- What strategies seem to work best?
- health, token, cash, money, points etc all mean the same thing and are interchangeable.
`
    }
  }

  const prompt = `You are an AI strategist helping a rat named "${rat.name}" choose which trip to enter in a game.

## Primary Goal
Your goal is to INCREASE the rat's TOTAL VALUE (balance + inventory item values). The rat gains value by completing trips that provide positive value changes - this includes gaining balance OR valuable items. Trips that result in 0 value change are wasteful - they risk death without any reward. Always prioritize trips likely to yield positive total value gains.

## Current Rat State
- Balance: ${rat.balance} credits
- Items in inventory: ${rat.inventory.length}
- Total trips survived: ${rat.tripCount}
${historySection}
## Available Trips
${JSON.stringify(tripsForPrompt, null, 2)}

## Your Task
Analyze each trip's prompt, balance, and statistics to maximize TOTAL VALUE gain. Consider:
1. Which trip is most likely to result in a POSITIVE value change (balance + items)? Avoid trips that seem likely to have no reward.
2. Which trip has the best risk/reward ratio? High balance trips often mean higher potential gains.
3. Based on the trip prompt, does it suggest opportunities for the rat to find loot, treasure, or rewards?
4. Avoid trips with prompts suggesting high danger with no clear reward opportunity.
5. IMPORTANT: Use the trip statistics to assess danger:
   - survivalRate: Bayesian-weighted survival percentage (accounts for sample size uncertainty)
   - confidence: "high" (10+ visits), "medium" (5-9 visits), "low" (<5 visits)
   - Prefer trips with high survivalRate AND high confidence. Be cautious of "low" confidence trips - their survival rate is uncertain.
${outcomeHistory.length > 0 ? "6. What patterns from previous outcomes show which trip types yield gains vs losses or deaths?" : ""}

## Response Format
Respond with a JSON object containing:
- tripId: The full ID of your chosen trip
- explanation: A brief (1-2 sentence) explanation of why you chose this trip

Example:
\`\`\`json
{
  "tripId": "0x1234...",
  "explanation": "This trip offers high rewards with a relatively safe scenario based on the prompt."
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
