import { loadData } from "@modules/cms/sanity";
import { queries } from "@modules/cms/groq";
import type { EventPrompts, OutcomePrompts } from "@sanity-types";

export const getSystemPrompts = async () => {
    const eventPrompts = await loadData(queries.eventPrompts, {}) as EventPrompts;
    const outcomePrompts = await loadData(queries.outcomePrompts, {}) as OutcomePrompts;

    return {
        eventSystemPrompt: combineSystemPrompts(eventPrompts),
        outcomeSystemPrompt: combineSystemPrompts(outcomePrompts)
    };
}

function combineSystemPrompts(doc: EventPrompts | OutcomePrompts) {
    return `Return format: ${doc.returnFormat?.code ?? ""} // ${doc.prompt ?? ""}`; 
}