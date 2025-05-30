/** 
 *  GROQ queries for Sanity CMS
 *  https://www.sanity.io/docs/groq
 */

export const queries = {
    activePrompts: '*[_id == "active-prompts"]{activeEventPrompt->{...}, activeCorrectionPrompt->{...}}[0]'
}