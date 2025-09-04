import { redirect } from "@sveltejs/kit"
import { TRIP_STATE } from "$lib/components/Room/Trip/state.svelte"
import { loadData } from "$lib/modules/content/sanity"
import { queries } from "$lib/modules/content/sanity/groq"
import { addressToRatImage } from "$lib/modules/utils"
export const prerender = false

export const load = async ({ params }) => {
  const result = await loadData(queries.singleOutcome, { id: params.outcomeId })
  const roomResult = await loadData(queries.singleRoom, { id: result.roomId })

  try {
    return {
      entryState: {
        state: TRIP_STATE.RESULTS,
        valid: true,
        processing: false,
        result,
        error: false,
        errorMessage: "",
        frozenRat: {
          inventory: [],
          name: result.ratName,
          image: addressToRatImage(result.ratId),
          balance: result.ratValue
        },
        frozenRoom: {
          ...roomResult,
          balance: result.roomValue
        }
      },
      roomId: params.roomId
    }
  } catch (error) {
    return redirect(302, `/${params.roomId}`)
  }
}
