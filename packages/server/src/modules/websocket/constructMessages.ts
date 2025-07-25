import type { Rat, Room, Player } from "@modules/types"
import { getEntityIndex, getEntityLevel } from "@modules/mud/getOnchainData"
import type { OffChainMessage, OutcomeReturnValue } from "@modules/types"
import { v4 as uuidv4 } from "uuid"

export function createOutcomeMessage(
  player: Player,
  rat: Rat,
  newRatBalance: number,
  room: Room,
  validatedOutcome: OutcomeReturnValue
): OffChainMessage {
  const outcomeMessage: OffChainMessage = {
    id: uuidv4(),
    topic: newRatBalance == 0 ? "rat__death" : "room__outcome",
    level: room.level,
    outcome: validatedOutcome,
    playerName: player.name,
    roomId: room.id,
    roomIndex: Number(room.index),
    ratName: rat.name,
    timestamp: Date.now()
  }

  return outcomeMessage
}

export function createRoomCreationMessage(roomId: string, player: Player): OffChainMessage {
  return {
    id: uuidv4(),
    topic: "room__creation",
    level: getEntityLevel(roomId),
    playerName: player.name,
    roomId: roomId,
    roomIndex: Number(getEntityIndex(roomId)),
    timestamp: Date.now()
  }
}
