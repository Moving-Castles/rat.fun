import type { ActivePrompts, Prompt } from "@sanity-private-cms-types"
import { loadDataPrivateSanity } from "@modules/cms/private/sanity"
import { queries } from "@modules/cms/private/groq"
import { CMSError, CMSAPIError, CMSDataError } from "@modules/cms"

// - - - - - -
// READ
// - - - - - -

type ExpandedActivePrompts = ActivePrompts & {
  activeEventPrompt: Prompt
  activeCorrectionPrompt: Prompt
}

export const getSystemPrompts = async () => {
  try {
    const activePrompts = (await loadDataPrivateSanity(
      queries.activePrompts,
      {}
    )) as ExpandedActivePrompts
    
    if (!activePrompts || !activePrompts.activeEventPrompt || !activePrompts.activeCorrectionPrompt) {
      throw new CMSDataError('Missing required prompt data', activePrompts);
    }
    
    return {
      combinedSystemPrompt: combineSystemPrompts(activePrompts.activeEventPrompt),
      correctionSystemPrompt: combineSystemPrompts(
        activePrompts.activeCorrectionPrompt
      ),
    }
  } catch (error) {
    // If it's already one of our custom errors, rethrow it
    if (error instanceof CMSError) {
      throw error;
    }
    
    // Otherwise, wrap it in our custom error
    throw new CMSAPIError(
      `Error fetching system prompts: ${error instanceof Error ? error.message : String(error)}`,
      error
    );
  }
}

function combineSystemPrompts(doc: Prompt) {
  return `Return format: ${doc.returnFormat?.code ?? ""} // ${doc.prompt ?? ""}`
}