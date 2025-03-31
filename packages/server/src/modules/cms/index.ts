import { loadData } from "@modules/cms/sanity";
import { queries } from "@modules/cms/groq";
import type { CorrectionPrompts, CombinedPrompts } from "@sanity-types";

export const getSystemPrompts = async () => {
    const correctionPrompts = await loadData(queries.correctionPrompts, {}) as CorrectionPrompts;
    const combinedPrompts = await loadData(queries.combinedPrompts, {}) as CombinedPrompts;
    return {
        combinedSystemPrompt: combineSystemPrompts(combinedPrompts),
        correctionSystemPrompt: combineSystemPrompts(correctionPrompts)
    };
}

function combineSystemPrompts(doc: CombinedPrompts | CorrectionPrompts) {
    return `Return format: ${doc.returnFormat?.code ?? ""} // ${doc.prompt ?? ""}`; 
}