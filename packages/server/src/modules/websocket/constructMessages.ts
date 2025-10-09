import type { Rat, Trip, Player } from "@modules/types"
import { getEntityIndex } from "@modules/mud/getOnchainData"
import type { OffChainMessage, OutcomeReturnValue } from "@modules/types"
import { v4 as uuidv4 } from "uuid"

export function createOutcomeMessage(
  player: Player,
  rat: Rat,
  newRatBalance: number,
  trip: Trip,
  validatedOutcome: OutcomeReturnValue
): OffChainMessage {
  const outcomeMessage: OffChainMessage = {
    id: uuidv4(),
    topic: newRatBalance == 0 ? "rat__death" : "trip__outcome",
    outcome: validatedOutcome,
    playerName: player.name,
    tripId: trip.id,
    tripIndex: Number(trip.index),
    ratName: rat.name,
    timestamp: Date.now()
  }

  return outcomeMessage
}

export function createTripCreationMessage(tripId: string, player: Player): OffChainMessage {
  return {
    id: uuidv4(),
    topic: "trip__creation",
    playerName: player.name,
    tripId: tripId,
    tripIndex: Number(getEntityIndex(tripId)),
    timestamp: Date.now()
  }
}
