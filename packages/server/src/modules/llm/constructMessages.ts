import { MessageParam } from "@anthropic-ai/sdk/resources"
import { randomInt } from "crypto"
import { GamePercentagesConfig, Rat, Trip, WorldEvent } from "@modules/types"
import { LogEntry, OutcomeReturnValue } from "@modules/types"
import { getLatestBlockNumber } from "@modules/mud/getOnchainData"
import { getTripMaxValuePerWin } from "@modules/mud/value"
import { TripLogger } from "@modules/logging"

export async function constructEventMessages(
  rat: Rat,
  trip: Trip,
  gamePercentagesConfig: GamePercentagesConfig,
  worldEvent: WorldEvent | undefined,
  logger: TripLogger
): Promise<MessageParam[]> {
  const messages: MessageParam[] = []
  // World event
  const latestBlockNumber = await getLatestBlockNumber()
  if (worldEvent?.prompt && worldEvent.expirationBlock > latestBlockNumber) {
    messages.push({ role: "user", content: `WorldEvent: ${worldEvent.prompt}` })
  }

  // Trip
  messages.push({ role: "user", content: `TripDescription: ${trip.prompt}` })

  // Is challenge
  messages.push({ role: "user", content: `IsChallengeTrip: ${trip.challengeTrip}` })

  // Max value per win
  const maxValuePerWin = getTripMaxValuePerWin(
    trip.tripCreationCost,
    trip.balance,
    gamePercentagesConfig,
    trip.challengeTrip,
    trip.overrideMaxValuePerWinPercentage
  )
  messages.push({
    role: "user",
    content: `TripMaxValuePerWin: ${maxValuePerWin}`
  })

  // Rat
  // messages.push({ role: "user", content: `RatName: ${rat.name}` })
  messages.push({ role: "user", content: `RatInventory: ${JSON.stringify(rat.inventory)}` })
  messages.push({ role: "user", content: `RatSlopamineBalance: ${rat.balance}` })

  // Random seed: 0.00 - 0.99 (cryptographically secure)
  const randomSeed = randomInt(0, 100) / 100
  logger.log(`Random seed generated: ${randomSeed}`)
  messages.push({ role: "user", content: `randomSeed: ${randomSeed}` })

  return messages
}

export function constructCorrectionMessages(
  unvalidatedOutcome: OutcomeReturnValue,
  validatedOutcome: OutcomeReturnValue,
  events: LogEntry[],
  ratDead: boolean
): MessageParam[] {
  const messages: MessageParam[] = []
  // Rat died in trip
  messages.push({ role: "user", content: `RatDead: ${ratDead}` })
  // Unvalidated outcome
  messages.push({ role: "user", content: `OldOutcome: ${JSON.stringify(unvalidatedOutcome)}` })
  // Validated outcome
  messages.push({ role: "user", content: `ValidatedOutcome: ${JSON.stringify(validatedOutcome)}` })
  // Event log
  messages.push({ role: "user", content: `Eventlog: ${JSON.stringify(events)}` })
  return messages
}
