import type { PageLoad } from "./$types"
import { loadData } from "$lib/modules/content/sanity"
import { queries } from "$lib/modules/content/sanity/groq"
import { errorHandler, CMSError } from "$lib/modules/error-handling"
import { getNetworkConfig } from "$lib/mud/getNetworkConfig"
import { getEnvironment } from "$lib/modules/network"

export const load: PageLoad = async ({ url }) => {
  const environment = getEnvironment(url)
  const networkConfig = getNetworkConfig(environment, url)

  try {
    const rooms = await loadData(queries.rooms, { worldAddress: networkConfig.worldAddress })

    return {
      rooms
    }
  } catch (error) {
    console.log(error.message)
    errorHandler(new CMSError("Could not load data"))
  }
}
