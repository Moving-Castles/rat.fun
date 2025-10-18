import type { PageLoad } from "./$types"
import { loadData } from "$lib/modules/content/sanity"
import { queries } from "$lib/modules/content/sanity/groq"
import { redirect } from "@sveltejs/kit"
import { errorHandler, CMSError } from "$lib/modules/error-handling"
import { getNetworkConfig } from "$lib/mud/getNetworkConfig"
import { getEnvironmentFromUrl } from "$lib/modules/network"

export const load: PageLoad = async ({ params, url }) => {
  try {
    // Get the worldAddress from the network config
    const environment = getEnvironmentFromUrl(url)
    const networkConfig = getNetworkConfig(environment, url)

    const tripContent = await loadData(queries.singleTrip, {
      id: params.tripId,
      worldAddress: networkConfig.worldAddress
    })

    return {
      tripId: params.tripId,
      tripContent
    }
  } catch (err) {
    console.error(err)
    errorHandler(new CMSError("Could not load data"))
    redirect(302, "/")
  }
}
