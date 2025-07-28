import { loadData } from '$lib/modules/content/sanity';
import { queries } from '$lib/modules/content/sanity/groq';
import { errorHandler, CMSError } from '$lib/modules/error-handling';

export const load = async ({ params, parent }) => {
  try {
    const { networkConfig } = await parent()
    const room = await loadData(queries.singleRoom, { id: params.roomId });
    const roomOutcomes = await loadData(queries.outcomesForRoom, { roomId: params.roomId, worldAddress: networkConfig.worldAddress })
    
    return {
      room,
      roomOutcomes
    };
  } catch {
    errorHandler(new CMSError('Could not fetch rooms'));
  }
};
