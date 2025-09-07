import { MessageParam } from "@anthropic-ai/sdk/resources"
import { Rat, Room, WorldEvent } from "@modules/types"
import { LogEntry, OutcomeReturnValue } from "@modules/types"
import { getLatestBlockNumber } from "@modules/mud/getOnchainData"

export async function constructEventMessages(
  rat: Rat,
  room: Room,
  worldEvent: WorldEvent | undefined
): Promise<MessageParam[]> {
  const messages: MessageParam[] = []
  // World event
  const latestBlockNumber = await getLatestBlockNumber()
  if (worldEvent?.prompt && worldEvent.expirationBlock > latestBlockNumber) {
    messages.push({ role: "user", content: `WorldEvent: ${worldEvent.prompt}` })
  }

  // Room
  messages.push({ role: "user", content: `TripDescription: ${room.prompt}` })
  // messages.push({ role: "user", content: `TripSlopamineBalance: ${room.balance}` })

  // Max value per win
  const valueLimit = Number(room.maxValuePerWin) ?? 0
  // Max value per win is capped at the room balance.
  const maxValuePerWin = Math.min(valueLimit, room.balance)
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
