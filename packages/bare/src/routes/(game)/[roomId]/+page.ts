import { loadData } from '$lib/modules/content/sanity';
import { queries } from '$lib/modules/content/sanity/groq';
import { errorHandler, CMSError } from '$lib/modules/error-handling';

export const load = async ({ params }) => {
  try {
    const room = await loadData(queries.singleRoom, { id: params.roomId });
    
    return { room };
  } catch {
    errorHandler(new CMSError('Could not fetch rooms'));
  }
};
