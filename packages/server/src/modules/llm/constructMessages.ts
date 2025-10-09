import { MessageParam } from "@anthropic-ai/sdk/resources"
import { GamePercentagesConfig, Rat, Trip, WorldEvent } from "@modules/types"
import { LogEntry, OutcomeReturnValue } from "@modules/types"
import { getLatestBlockNumber } from "@modules/mud/getOnchainData"
import { getTripMaxValuePerWin } from "@modules/mud/value"

export async function constructEventMessages(
  rat: Rat,
  trip: Trip,
  gamePercentagesConfig: GamePercentagesConfig,
  worldEvent: WorldEvent | undefined
): Promise<MessageParam[]> {
  const messages: MessageParam[] = []
  // World event
  const latestBlockNumber = await getLatestBlockNumber()
  if (worldEvent?.prompt && worldEvent.expirationBlock > latestBlockNumber) {
    messages.push({ role: "user", content: `WorldEvent: ${worldEvent.prompt}` })
  }

  // Trip
  messages.push({ role: "user", content: `TripDescription: ${trip.prompt}` })

  // Max value per win
  const maxValuePerWin = getTripMaxValuePerWin(
    trip.tripCreationCost,
    trip.balance,
    gamePercentagesConfig
  )
  messages.push({
    role: "user",
    content: `TripMaxValuePerWin: ${maxValuePerWin}`
  })

  // Rat
  messages.push({ role: "user", content: `RatName: ${rat.name}` })
  messages.push({ role: "user", content: `RatInventory: ${JSON.stringify(rat.inventory)}` })
  messages.push({ role: "user", content: `RatSlopamineBalance: ${rat.balance}` })
  return messages
}

export function constructCorrectionMessages(
  unvalidatedOutcome: OutcomeReturnValue,
  validatedOutcome: OutcomeReturnValue,
  events: LogEntry[]
): MessageParam[] {
  const messages: MessageParam[] = []
  // Unvalidated outcome
  messages.push({ role: "user", content: `OldOutcome: ${JSON.stringify(unvalidatedOutcome)}` })
  // Validated outcome
  messages.push({ role: "user", content: `ValidatedOutcome: ${JSON.stringify(validatedOutcome)}` })
  // Event log
  messages.push({ role: "user", content: `Eventlog: ${JSON.stringify(events)}` })
  return messages
}
