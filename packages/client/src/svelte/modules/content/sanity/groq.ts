/** 
 *  GROQ queries for Sanity CMS
 *  https://www.sanity.io/docs/groq
 */

export const queries = {
    rooms: '*[_type == "room"]',
    outcomesForRoom: '*[_type == "outcome" && roomId == $roomId]',
    outcomesForRat: '*[_type == "outcome" && ratId == $ratId]',
}