/**
 * ========================================
 *  content/sanity/groq.ts
 * ========================================
 *  GROQ queries for Sanity CMS
 *  https://www.sanity.io/docs/groq
 */

export const queries = {
  trips: '*[_type == "trip" && worldAddress == $worldAddress]',
  outcomes: `*[_type == "outcome" && worldAddress == $worldAddress] {
    ...,
    "trip": *[_type == "trip" && _id == ^.tripId][0],
    "readableLog": array::join(log[]{"entry": timestamp + " => " + event}.entry, ", ")
  }`,
  worldEvents:
    '*[_type == "worldEvent" && worldAddress == $worldAddress] | order(activationDateTime asc)', // filter by activationDateTime upcoming, sort by activationDate soonest first
  outcomesForTrip: `*[_type == "outcome" && tripId == $tripId && worldAddress == $worldAddress] {
    ...,
    "readableLog": array::join(log[]{"entry": timestamp + " => " + event}.entry, ", ")
  }`,
  outcomesForRat: `*[_type == "outcome" && ratId == $ratId && worldAddress == $worldAddress] {
    ...,
    "readableLog": array::join(log[]{"entry": timestamp + " => " + event}.entry, ", ")
  }`,
  singleTrip: `*[_type == "trip" && _id == $id][0]`,
  singleOutcome: `*[_type == "outcome" && _id == $id][0] {
    ...,
    "readableLog": array::join(log[]{"entry": timestamp + " => " + event}.entry, ", ")
  }`
}
