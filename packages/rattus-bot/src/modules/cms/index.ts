import { createClient, type SanityClient } from "@sanity/client"

const PUBLIC_SANITY_CMS_ID = "saljmqwt"

export const sanityClient: SanityClient = createClient({
  projectId: PUBLIC_SANITY_CMS_ID,
  dataset: "production",
  apiVersion: "2025-06-01",
  useCdn: false
})

export interface Outcome {
  _id: string
  tripId: string
  ratId: string
  ratName: string
  ratValueChange: number
  ratValue: number
  oldRatValue: number
  newRatBalance: number
  oldRatBalance: number
}

/**
 * Fetch all outcomes for a specific trip from the public CMS
 */
export async function getOutcomesForTrip(tripId: string, worldAddress: string): Promise<Outcome[]> {
  const query = `*[_type == "outcome" && tripId == $tripId && worldAddress == $worldAddress] {
    _id,
    tripId,
    ratId,
    ratName,
    ratValueChange,
    ratValue,
    oldRatValue,
    newRatBalance,
    oldRatBalance
  }`

  return sanityClient.fetch(query, { tripId, worldAddress })
}

/**
 * Fetch outcomes for multiple trips in a single query
 */
export async function getOutcomesForTrips(
  tripIds: string[],
  worldAddress: string
): Promise<Outcome[]> {
  const query = `*[_type == "outcome" && tripId in $tripIds && worldAddress == $worldAddress] {
    _id,
    tripId,
    ratId,
    ratName,
    ratValueChange,
    ratValue,
    oldRatValue,
    newRatBalance,
    oldRatBalance
  }`

  return sanityClient.fetch(query, { tripIds, worldAddress })
}
