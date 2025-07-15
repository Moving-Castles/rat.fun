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
  // Check if there is an active world event
  const latestBlockNumber = await getLatestBlockNumber()
  if (worldEvent?.prompt && worldEvent.expirationBlock > latestBlockNumber) {
    messages.push({ role: "user", content: `WorldEvent: ${worldEvent.prompt}` })
  }
  // Room
  messages.push({ role: "user", content: `RoomDescription: ${room.prompt}` })
  messages.push({ role: "user", content: `RoomBalance: ${room.balance}` })
  if (room.isSpecialRoom) {
    messages.push({ role: "user", content: `RoomIsSpecial: true` })
    messages.push({ role: "user", content: `RoomMaxValuePerWin: ${room.maxValuePerWin}` })
  }
  // Rat
  messages.push({ role: "user", content: `RatName: ${rat.name}` })
  messages.push({ role: "user", content: `RatTraits: ${JSON.stringify(rat.traits)}` })
  messages.push({ role: "user", content: `RatItems: ${JSON.stringify(rat.inventory)}` })
  messages.push({ role: "user", content: `RatStats: ${JSON.stringify(rat.stats)}` })
  messages.push({ role: "user", content: `RatBalance: ${rat.balance}` })
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
