import type { PageLoad } from "./$types"
import { loadData } from "$lib/modules/content/sanity"
import { queries } from "$lib/modules/content/sanity/groq"
import { errorHandler, CMSError } from "$lib/modules/error-handling"
import { getNetworkConfig } from "$lib/mud/getNetworkConfig"
import { getEnvironmentFromUrl } from "$lib/modules/network"

export const load: PageLoad = async ({ url }) => {
  const environment = getEnvironmentFromUrl(url)
  const networkConfig = getNetworkConfig(environment, url)

  try {
    const rooms = await loadData(queries.rooms, { worldAddress: networkConfig.worldAddress })
    return {
      rooms
    }
  } catch {
    errorHandler(new CMSError("Could not load data"))
  }
}
