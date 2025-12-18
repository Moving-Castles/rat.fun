import type { PageLoad } from "./$types"
import { loadData } from "$lib/modules/content/sanity"
import { queries } from "$lib/modules/content/sanity/groq"
import { errorHandler, CMSError } from "$lib/modules/error-handling"
import { getWorldAddress } from "@ratfun/common/mud"
import { environment as environmentStore } from "$lib/modules/network"
import { get } from "svelte/store"

export const load: PageLoad = async ({ params, url }) => {
  try {
    const worldAddress = getWorldAddress(get(environmentStore))

    const tripContent = await loadData(queries.singleTrip, {
      id: params.tripId,
      worldAddress
    })
    const liquidating = url.searchParams.has("liquidate") || false

    return {
      tripContent,
      liquidating,
      tripId: params.tripId
    }
  } catch {
    errorHandler(new CMSError("Could not load data"))
  }
}
