import { loadData } from "@modules/cms/sanity";
import { queries } from "@modules/cms/groq";
import type { EventPrompts, OutcomePrompts, CorrectionPrompts, CombinedPrompts } from "@sanity-types";

export const getSystemPrompts = async () => {
    const eventPrompts = await loadData(queries.eventPrompts, {}) as EventPrompts;
    const outcomePrompts = await loadData(queries.outcomePrompts, {}) as OutcomePrompts;
    const correctionPrompts = await loadData(queries.correctionPrompts, {}) as CorrectionPrompts;
    const combinedPrompts = await loadData(queries.combinedPrompts, {}) as CombinedPrompts;
    return {
        eventSystemPrompt: combineSystemPrompts(eventPrompts),
        outcomeSystemPrompt: combineSystemPrompts(outcomePrompts),
        combinedSystemPrompt: combineSystemPrompts(combinedPrompts),
        correctionSystemPrompt: combineSystemPrompts(correctionPrompts)
    };
}

function combineSystemPrompts(doc: EventPrompts | OutcomePrompts | CorrectionPrompts | CombinedPrompts) {
    return `Return format: ${doc.returnFormat?.code ?? ""} // ${doc.prompt ?? ""}`; 
}