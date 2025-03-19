/** 
 *  GROQ queries for Sanity CMS
 *  https://www.sanity.io/docs/groq
 */
export const queries = {
    eventPrompts: '*[_id == "event-prompts"][0]',
    outcomePrompts: '*[_id == "outcome-prompts"][0]',
    correctionPrompts: '*[_id == "correction-prompts"][0]',
    combinedPrompts: '*[_id == "combined-prompts"][0]',
    chatPrompts: '*[_id == "chat-prompts"][0]',
    pvpEventPrompts: '*[_id == "pvp-event-prompts"][0]',
    pvpOutcomePrompts: '*[_id == "pvp-outcome-prompts"][0]',
    pvpCorrectionPrompts: '*[_id == "pvp-correction-prompts"][0]'
}