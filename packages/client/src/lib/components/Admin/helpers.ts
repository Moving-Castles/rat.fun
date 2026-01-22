import type { Trip as SanityTrip, Outcome as SanityOutcome } from "@sanity-types"
import type {
  TripEventVisit,
  TripEventDeath,
  TripEventCreation,
  TripEventLiquidation,
  TripEventDepletion,
  TripEvent
} from "$lib/components/Admin/types"
import { TRIP_EVENT_TYPE } from "$lib/components/Admin/enums"
import { get } from "svelte/store"
import { blockNumber } from "$lib/modules/network"
import { blockNumberToTimestamp } from "@ratfun/shared-utils"

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
    const previousOutcomeValue = previousOutcome?.tripValue ?? outcome.oldTripValue ?? Number(trip.tripCreationCost) // Value from the previous trip, or oldTripValue (accounts for boosts), or creation cost
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
  if (trip.liquidationBlock && trip.liquidationValue !== undefined) {
    const liquidationTime = blockNumberToTimestamp(
      Number(trip.liquidationBlock),
      Number(get(blockNumber) ?? 0)
    )
    const liquidationValueChange = Number(trip.tripCreationCost) - Number(trip.liquidationValue)

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
  } else if (Number(trip.balance) === 0 && !excludeLiquidation) {
    // get previous outcome
    const lastOutcome = outcomes?.[outcomes.length - 1]
    const depletionTime = new Date(lastOutcome?._createdAt)?.getTime() + 1 || 1
    const depletionValueChange = Number(trip.tripCreationCost)

    // Liquidation: you get back the trip value (before tax) and close the position
    tripData.push({
      eventType: TRIP_EVENT_TYPE.DEPLETED,
      time: depletionTime,
      value: 0, // Will be set later in accumulation
      valueChange: depletionValueChange,
      index: 0, // Will be set later
      tripId: tripId,
      tripCreationCost: Number(trip.tripCreationCost),
      meta: sanityTripContent
    } as TripEventDepletion)
  }

  return tripData
}

export function makeHref(
  point:
    | TripEventVisit
    | TripEventDeath
    | TripEventLiquidation
    | TripEventCreation
    | TripEventDepletion
) {
  // For visit and death events, meta is SanityOutcome
  if (point.eventType === TRIP_EVENT_TYPE.VISIT || point.eventType === TRIP_EVENT_TYPE.DEATH) {
    return `/trip-lab/${point.meta?.tripId}?focusId=${point.meta._id}`
  } else if (
    point.eventType === TRIP_EVENT_TYPE.LIQUIDATION ||
    point.eventType === TRIP_EVENT_TYPE.CREATION ||
    point.eventType === TRIP_EVENT_TYPE.DEPLETED
  ) {
    // For liquidation and creation events, meta is SanityTrip
    return `/trip-lab/${point.meta._id}`
  }
}

/**
 * Maps a local trip-specific event index to the global combined event index.
 * This is needed because nested AdminTripPreview has a different graphData array
 * than the parent Admin component.
 */
export function mapLocalIndexToGlobal(
  localIndex: number,
  localGraphData: TripEvent[],
  playerTrips: Record<string, Trip>,
  staticContent: any
): number {
  const localEvent = localGraphData[localIndex]
  if (!localEvent?.meta?._id) return -1

  // Reconstruct parent's combined graphData the same way Admin.svelte does
  const trips = Object.values(playerTrips)
  if (!trips.length) return -1

  const combinedData: TripEvent[] = []
  const tripContentMap = new Map(staticContent?.trips?.map((t: any) => [t._id, t]) || [])
  const outcomesByTripId = (staticContent?.outcomes || []).reduce(
    (acc: Record<string, SanityOutcome[]>, outcome: SanityOutcome) => {
      if (outcome.tripId) {
        if (!acc[outcome.tripId]) acc[outcome.tripId] = []
        acc[outcome.tripId].push(outcome)
      }
      return acc
    },
    {}
  )

  trips.forEach(trip => {
    const tripId = Object.keys(playerTrips).find(key => playerTrips[key] === trip) || ""
    const sanityTripContent = tripContentMap.get(tripId) as SanityTrip | undefined
    if (!sanityTripContent) return
    const outcomes = outcomesByTripId[tripId] || []
    const profitLoss = calculateProfitLossForTrip(trip, tripId, sanityTripContent, outcomes)
    combinedData.push(...profitLoss)
  })

  // Sort by time
  combinedData.sort((a, b) => a.time - b.time)

  // Add baseline
  const earliestTime = combinedData.length > 0 ? combinedData[0].time : Date.now()
  const dataWithBaseline = [
    {
      eventType: TRIP_EVENT_TYPE.BASELINE,
      time: earliestTime - 1000,
      value: 0,
      valueChange: 0,
      tripId: "",
      tripCreationCost: 0
    },
    ...combinedData
  ]

  // Accumulate and add indices
  let runningBalance = 0
  const parentGraphData = dataWithBaseline.map((point, index) => {
    runningBalance += point.valueChange || 0
    return {
      ...point,
      index,
      value: runningBalance
    }
  })

  // Find matching event by meta._id
  const globalIndex = parentGraphData.findIndex(
    e => "meta" in e && e.meta?._id === localEvent.meta._id
  )

  // Return the found index, or -1 if not found
  return globalIndex >= 0 ? globalIndex : -1
}
