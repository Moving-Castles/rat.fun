import type { StaticContent } from "$lib/modules/content"
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

/**
 * Create plots from a list of trips
 * @param tripList - A list of trips
 * @param staticContent - The static content from the CMS
 * @returns A record of trip id to plot points
 */
export function createPlotsFromTripList(
  tripList: [string, Trip][],
  staticContent: StaticContent
): Record<string, TripEvent[]> {
  return Object.fromEntries(
    tripList.map(([tripId, trip]) => {
      // Get sanity content for all trips
      const sanityTripContent = staticContent?.trips?.find((r: SanityTrip) => r._id == tripId)

      // Get sanity content for all outcomes matching the trip id
      const sanityOutcomes =
        staticContent?.outcomes?.filter((o: SanityOutcome) => o.tripId == tripId) || []

      // Sort the sanity outcomes in order of creation
      sanityOutcomes.sort((a: SanityOutcome, b: SanityOutcome) => {
        return new Date(b._createdAt).getTime() - new Date(a._createdAt).getTime()
      })
      const tripOutcomes = sanityOutcomes.reverse()

      // Create plot points from trip and outcomes
      const value = [
        {
          time: 0,
          value: Number(trip.tripCreationCost),
          meta: sanityTripContent
        },
        ...tripOutcomes
      ].map((o, i) => {
        return {
          time: i,
          value: o?.value || 0,
          index: i,
          tripId: tripId,
          tripCreationCost: Number(trip.tripCreationCost),
          meta: o
        }
      })

      // Map the values
      return [tripId, value]
    })
  )
}

export function calculateProfitLossForTrip(
  trip: Trip,
  tripId: string,
  sanityTripContent: SanityTrip,
  outcomes: SanityOutcome[]
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
    const previousTrip = tripOutcomes[i - 1]

    const outcomeTime = new Date(outcome._createdAt).getTime()
    const previousTripValue = previousTrip?.tripValue || Number(trip.tripCreationCost) // Value from the previous trip, and if it's the first outcome, creation cost of the trip
    const currentTripValue = outcome.tripValue || 0
    const valueChange = currentTripValue - previousTripValue

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
  if (trip.liquidationBlock && trip.liquidationValue !== undefined) {
    const liquidationTime = blockNumberToTimestamp(Number(trip.liquidationBlock))

    // Get the last trip value before liquidation
    const lastOutcome = tripOutcomes[tripOutcomes.length - 1]
    const finalTripValue = lastOutcome?.tripValue || 0

    const liquidationValueChange = Number(trip.liquidationValue) - finalTripValue

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
