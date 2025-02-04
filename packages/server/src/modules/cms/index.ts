import { loadData } from "@modules/cms/sanity";
import { queries } from "@modules/cms/groq";
import type { EventPrompts, OutcomePrompts, CorrectionPrompts } from "@sanity-types";

export const getSystemPrompts = async () => {
    const eventPrompts = await loadData(queries.eventPrompts, {}) as EventPrompts;
    const outcomePrompts = await loadData(queries.outcomePrompts, {}) as OutcomePrompts;
    const correctionPrompts = await loadData(queries.correctionPrompts, {}) as CorrectionPrompts;

    return {
        eventSystemPrompt: combineSystemPrompts(eventPrompts),
        outcomeSystemPrompt: combineSystemPrompts(outcomePrompts),
        correctionSystemPrompt: combineSystemPrompts(correctionPrompts)
    };
}

export const getPvPSystemPrompts = async () => {
    const pvpEventPrompts = await loadData(queries.pvpEventPrompts, {}) as EventPrompts;
    const pvpOutcomePrompts = await loadData(queries.pvpOutcomePrompts, {}) as OutcomePrompts;
    const pvpCorrectionPrompts = await loadData(queries.pvpCorrectionPrompts, {}) as CorrectionPrompts;

    return {
        eventSystemPrompt: combineSystemPrompts(pvpEventPrompts),
        outcomeSystemPrompt: combineSystemPrompts(pvpOutcomePrompts),
        correctionSystemPrompt: combineSystemPrompts(pvpCorrectionPrompts)
    };
}

function combineSystemPrompts(doc: EventPrompts | OutcomePrompts | CorrectionPrompts) {
    return `Return format: ${doc.returnFormat?.code ?? ""} // ${doc.prompt ?? ""}`; 
}