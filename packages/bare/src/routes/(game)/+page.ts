import { loadData } from '$lib/modules/content/sanity';
import { queries } from '$lib/modules/content/sanity/groq';
import { errorHandler, CMSError } from '$lib/modules/error-handling';

export const load = async ({ parent, url }) => {
	const { networkConfig } = await parent();

	try {
    const rooms = await loadData(queries.rooms, { worldAddress: networkConfig.worldAddress });
    
		return { rooms };
	} catch {
		errorHandler(new CMSError('Could not fetch rooms'));
	}
};
