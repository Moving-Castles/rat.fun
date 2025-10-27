/**
 *  GROQ queries for Sanity CMS
 *  https://www.sanity.io/docs/groq
 */

export const queries = {
  trip: "*[_id == $tripId][0]",
  statistics: `*[_type == "statistics" && worldAddress == $worldAddress][0]`
}
