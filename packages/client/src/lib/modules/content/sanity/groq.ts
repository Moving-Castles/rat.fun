/**
 * ========================================
 *  content/sanity/groq.ts
 * ========================================
 *  GROQ queries for Sanity CMS
 *  https://www.sanity.io/docs/groq
 */

const ratImages = '*[_id == "rat-images"][0]'
const trips = '*[_type == "trip" && worldAddress == $worldAddress]'
const outcomes = `*[_type == "outcome" && worldAddress == $worldAddress] {
  ...,
  "trip": *[_type == "trip" && _id == ^.tripId][0],
  "readableLog": array::join(log[]{"entry": timestamp + " => " + event}.entry, ", ")
}`
const worldEvents =
  '*[_type == "worldEvent" && worldAddress == $worldAddress] | order(activationDateTime asc)'

export const queries = {
  ratImages,
  trips,
  outcomes,
  worldEvents,
  staticContent: `{
    "ratImages": ${ratImages},
    "trips": ${trips},
    "outcomes": ${outcomes},
    "worldEvents": ${worldEvents}
  }`,
  outcomesForTrip: `*[_type == "outcome" && tripId == $tripId && worldAddress == $worldAddress] {
    ...,
    "readableLog": array::join(log[]{"entry": timestamp + " => " + event}.entry, ", ")
  }`,
  outcomesForRat: `*[_type == "outcome" && ratId == $ratId && worldAddress == $worldAddress] {
    ...,
    "readableLog": array::join(log[]{"entry": timestamp + " => " + event}.entry, ", ")
  }`,
  singleTrip: `*[_type == "trip" && _id == $id && worldAddress == $worldAddress][0]`,
  singleOutcome: `*[_type == "outcome" && _id == $id][0] {
    ...,
    "readableLog": array::join(log[]{"entry": timestamp + " => " + event}.entry, ", ")
  }`
}
