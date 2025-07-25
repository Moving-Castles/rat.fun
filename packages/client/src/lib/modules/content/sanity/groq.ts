/**
 * ========================================
 *  content/sanity/groq.ts
 * ========================================
 *  GROQ queries for Sanity CMS
 *  https://www.sanity.io/docs/groq
 */

export const queries = {
  rooms: '*[_type == "room" && worldAddress == $worldAddress]',
  outcomes: '*[_type == "outcome" && worldAddress == $worldAddress]',
  worldEvents:
    '*[_type == "worldEvent" && worldAddress == $worldAddress] | order(activationDateTime asc)', // filter by activationDateTime upcoming, sort by activationDate soonest first
  outcomesForRoom: '*[_type == "outcome" && roomId == $roomId && worldAddress == $worldAddress]',
  outcomesForRat: '*[_type == "outcome" && ratId == $ratId && worldAddress == $worldAddress]',
  singleRoom: `*[_type == "room" && _id == $id][0]`,
  singleOutcome: `*[_type == "outcome" && _id == $id][0]`
}
