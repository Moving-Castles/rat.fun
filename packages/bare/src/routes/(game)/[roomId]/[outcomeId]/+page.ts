import { loadData } from '$lib/modules/content/sanity';
import { queries } from '$lib/modules/content/sanity/groq';
import { errorHandler, CMSError } from '$lib/modules/error-handling';

export const load = async ({ params }) => {
  try {
    const outcome = await loadData(queries.singleOutcome, { id: params.outcomeId });
    
    return { outcome };
  } catch {
    errorHandler(new CMSError('Could not fetch rooms'));
  }
};
