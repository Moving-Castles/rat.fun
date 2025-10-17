import type { PageLoad } from "./$types"
import { loadData } from "$lib/modules/content/sanity"
import { queries } from "$lib/modules/content/sanity/groq"
import { errorHandler, CMSError } from "$lib/modules/error-handling"

export const load: PageLoad = async ({ params, url }) => {
  try {
    const tripContent = await loadData(queries.singleTrip, { id: params.tripId })
    const liquidating = url.searchParams.has("liquidate") || false

    return {
      tripContent,
      liquidating
    }
  } catch {
    errorHandler(new CMSError("Could not load data"))
  }
}
