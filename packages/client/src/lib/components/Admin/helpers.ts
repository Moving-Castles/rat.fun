import type { PlotPoint } from "$lib/components/Admin/types"
import type { StaticContent } from "$lib/modules/content"
import type { Trip as SanityTrip, Outcome as SanityOutcome } from "@sanity-types"

/**
 * Create plots from a list of trips
 * @param tripList - A list of trips
 * @param staticContent - The static content from the CMS
 * @returns A record of trip id to plot points
 */
export function createPlotsFromTripList(
  tripList: [string, Trip][],
  staticContent: StaticContent
): Record<string, PlotPoint[]> {
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
          tripValue: Number(trip.tripCreationCost),
          meta: sanityTripContent
        },
        ...tripOutcomes
      ].map((o, i) => {
        return {
          time: i,
          value: o?.tripValue || 0,
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
