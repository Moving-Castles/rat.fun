import { redirect } from "@sveltejs/kit"
import { loadData } from "$lib/modules/content/sanity"
import { queries } from "$lib/modules/content/sanity/groq"
export const prerender = false

export const load = async ({ params }) => {
  const result = await loadData(queries.singleOutcome, { id: params.outcomeId })
  const trip = await loadData(queries.singleTrip, { id: result.tripId })

  try {
    return { trip, result }
  } catch {
    return redirect(302, `/${params.tripId}`)
  }
}
