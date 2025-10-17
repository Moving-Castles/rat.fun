import type { Trip as SanityTrip, Outcome as SanityOutcome } from "@sanity-types"
import type {
  TripEventVisit,
  TripEventDeath,
  TripEventCreation,
  TripEventLiquidation,
  TripEvent
} from "$lib/components/Admin/types"
import { TRIP_EVENT_TYPE } from "$lib/components/Admin/enums"

import { blockNumberToTimestamp } from "$lib/modules/utils"

export function calculateProfitLossForTrip(
  trip: Trip,
  tripId: string,
  sanityTripContent: SanityTrip,
  outcomes: SanityOutcome[],
  excludeLiquidation = false
): TripEvent[] {
  // Abort if no trip content is found
  if (!sanityTripContent) {
    return []
  }

  // Sort the outcomes in order of creation
  outcomes.sort((a, b) => {
    return new Date(b._createdAt).getTime() - new Date(a._createdAt).getTime()
  })

  // Reverse the outcomes
  const tripOutcomes = outcomes.reverse()

  // Creation time of the trip
  const initialTime = new Date(sanityTripContent?._createdAt ?? "").getTime()

  // Build the data array with initial point and outcomes
  const tripData: TripEvent[] = []

  /***************************
   * ADD CREATION EVENT
   **************************/
  tripData.push({
    eventType: TRIP_EVENT_TYPE.CREATION,
    time: initialTime,
    value: 0, // Will be set later in accumulation
    valueChange: 0, // Neutral
    index: 0, // Will be set later
    tripId: tripId,
    tripCreationCost: Number(trip.tripCreationCost),
    meta: sanityTripContent
  } as TripEventCreation)

  /***************************
   * ADD VISIT/DEATH EVENTS
   **************************/
  tripOutcomes.forEach((outcome, i) => {
    const previousOutcome = tripOutcomes[i - 1]

    const outcomeTime = new Date(outcome._createdAt).getTime()
    const previousOutcomeValue = previousOutcome?.tripValue || Number(trip.tripCreationCost) // Value from the previous trip, and if it's the first outcome, creation cost of the trip
    const currentTripValue = outcome.tripValue || 0
    const valueChange = currentTripValue - previousOutcomeValue

    let eventData = {} as TripEventDeath | TripEventVisit

    if (outcome?.ratValue == 0) {
      // Death
      eventData = {
        eventType: TRIP_EVENT_TYPE.DEATH,
        time: outcomeTime,
        value: 0, // Will be set later in accumulation
        valueChange: valueChange,
        index: 0, // Will be set later
        tripId: tripId,
        tripCreationCost: Number(trip.tripCreationCost),
        meta: outcome
      } as TripEventDeath
    } else {
      // Visit
      eventData = {
        eventType: TRIP_EVENT_TYPE.VISIT,
        time: outcomeTime,
        value: 0, // Will be set later in accumulation
        valueChange: valueChange,
        index: 0, // Will be set later
        tripId: tripId,
        tripCreationCost: Number(trip.tripCreationCost),
        meta: outcome
      } as TripEventVisit
    }

    tripData.push(eventData)
  })

  /***************************
   * ADD LIQUIDATION EVENT
   **************************/
  if (
    (trip.liquidationBlock && trip.liquidationValue !== undefined) ||
    (Number(trip.balance) === 0 && !excludeLiquidation)
  ) {
    let liquidationTime = 0
    let liquidationValueChange = 0

    if (trip.liquidated) {
      liquidationTime = blockNumberToTimestamp(Number(trip.liquidationBlock))
      liquidationValueChange = Number(trip.tripCreationCost) - Number(trip.liquidationValue)
    } else {
      // get previous outcome
      const lastOutcome = outcomes?.[outcomes.length - 1]
      liquidationTime = new Date(lastOutcome?._createdAt)?.getTime() + 1 || 1
      liquidationValueChange = Number(trip.tripCreationCost)
    }

    // Liquidation: you get back the trip value (before tax) and close the position
    tripData.push({
      eventType: TRIP_EVENT_TYPE.LIQUIDATION,
      time: liquidationTime,
      value: 0, // Will be set later in accumulation
      valueChange: liquidationValueChange,
      index: 0, // Will be set later
      tripId: tripId,
      tripCreationCost: Number(trip.tripCreationCost),
      meta: sanityTripContent
    } as TripEventLiquidation)
  }

  return tripData
}
