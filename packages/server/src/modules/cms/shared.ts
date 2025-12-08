import type { Outcome as PublicOutcomeDoc } from "@sanity-public-cms-types"
import type { Outcome as PrivateOutcomeDoc } from "@sanity-private-cms-types"
import type { Rat, Trip, Player, DebuggingInfo } from "@modules/types"
import type { CorrectionReturnValue, OutcomeReturnValue } from "@modules/types"
import { calculateTotalRatValue } from "@modules/mud/value"
import { v4 as uuidv4 } from "uuid"

// Type aliases for outcome documents without Sanity metadata fields
type NewPublicOutcomeDoc = Omit<PublicOutcomeDoc, "_createdAt" | "_updatedAt" | "_rev">
type NewPrivateOutcomeDoc = Omit<PrivateOutcomeDoc, "_createdAt" | "_updatedAt" | "_rev">

/**
 * Helper function to create outcome event log entries
 */
export function createOutcomeEvents(events: CorrectionReturnValue) {
  return (events?.log ?? []).map(event => ({
    _key: uuidv4(),
    event: event.event,
    timestamp: event.timestamp
  }))
}

/**
 * Helper function to create balance transfer entries
 */
export function createBalanceTransfers(balanceTransfers: OutcomeReturnValue["balanceTransfers"]) {
  return balanceTransfers.map(balanceTransfer => ({
    _key: uuidv4(),
    logStep: balanceTransfer.logStep,
    amount: balanceTransfer.amount
  }))
}

/**
 * Helper function to create item change entries
 */
export function createItemChanges(itemChanges: OutcomeReturnValue["itemChanges"]) {
  return itemChanges.map(itemChange => ({
    _key: uuidv4(),
    logStep: itemChange.logStep,
    type: itemChange.type,
    name: itemChange.name,
    value: itemChange.value,
    id: itemChange.id ?? ""
  }))
}

/**
 * Helper function to create items lost on death entries
 */
export function createItemsLostOnDeath(
  itemsLostOnDeath: NonNullable<OutcomeReturnValue["itemsLostOnDeath"]>
) {
  return itemsLostOnDeath.map(item => ({
    _key: uuidv4(),
    name: item.name,
    value: item.value,
    id: item.id
  }))
}

/**
 * Create a base outcome document structure with all common fields (public-safe, no sensitive data)
 */
export function createBaseOutcomeDocument(
  outcomeId: string,
  worldAddress: string,
  player: Player,
  trip: Trip,
  rat: Rat,
  newTripValue: number,
  tripValueChange: number,
  newRatValue: number,
  ratValueChange: number,
  newRatBalance: number,
  events: CorrectionReturnValue,
  outcome: OutcomeReturnValue,
  mainProcessingTime: number
): NewPublicOutcomeDoc {
  // Calculate old values (pre-visit) from the trip and rat objects
  const oldTripValue = trip.balance
  const oldRatValue = calculateTotalRatValue(rat)
  const oldRatBalance = rat.balance

  const baseDoc: NewPublicOutcomeDoc = {
    _type: "outcome",
    title: outcomeId,
    _id: outcomeId,
    worldAddress: worldAddress,
    playerId: player.id,
    tripId: trip.id,
    tripIndex: Number(trip.index),
    log: createOutcomeEvents(events),
    ratId: rat.id,
    ratName: rat.name,
    oldTripValue: oldTripValue,
    tripValue: newTripValue,
    tripValueChange: tripValueChange,
    oldRatValue: oldRatValue,
    ratValue: newRatValue,
    ratValueChange: ratValueChange,
    oldRatBalance: oldRatBalance,
    newRatBalance: newRatBalance,
    playerName: player.name,
    mainProcessingTime: mainProcessingTime,
    slug: {
      _type: "slug",
      current: outcomeId
    }
  }

  // Add optional fields if they exist
  if (outcome.balanceTransfers) {
    baseDoc.balanceTransfers = createBalanceTransfers(outcome.balanceTransfers)
  }

  if (outcome.itemChanges && outcome.itemChanges.length > 0) {
    baseDoc.itemChanges = createItemChanges(outcome.itemChanges)
  }

  if (outcome.itemsLostOnDeath && outcome.itemsLostOnDeath.length > 0) {
    baseDoc.itemsLostOnDeath = createItemsLostOnDeath(outcome.itemsLostOnDeath)
  }

  return baseDoc
}

/**
 * Create a full outcome document with sensitive debugging fields
 */
export function createFullOutcomeDocument(
  outcomeId: string,
  worldAddress: string,
  player: Player,
  trip: Trip,
  rat: Rat,
  newTripValue: number,
  tripValueChange: number,
  newRatValue: number,
  ratValueChange: number,
  newRatBalance: number,
  events: CorrectionReturnValue,
  outcome: OutcomeReturnValue,
  mainProcessingTime: number,
  debuggingInfo: DebuggingInfo,
  logOutput?: string
): NewPrivateOutcomeDoc {
  const baseDoc = createBaseOutcomeDocument(
    outcomeId,
    worldAddress,
    player,
    trip,
    rat,
    newTripValue,
    tripValueChange,
    newRatValue,
    ratValueChange,
    newRatBalance,
    events,
    outcome,
    mainProcessingTime
  )

  return {
    ...baseDoc,
    debuggingInfo: JSON.stringify(debuggingInfo),
    logOutput: logOutput
  }
}
