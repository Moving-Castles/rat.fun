import { redirect } from "@sveltejs/kit"
import { ROOM_RESULT_STATE } from "$lib/components/Room/RoomResult/state.svelte"
import { loadData } from "$lib/modules/content/sanity"
import { queries } from "$lib/modules/content/sanity/groq"
export const prerender = false

export const load = async ({ params }) => {
  const result = await loadData(queries.outcomes, { id: params.outcomeId })

  try {
    return {
      entryState: {
        state: ROOM_RESULT_STATE.SHOWING_RESULTS,
        valid: true,
        processing: false,
        result,
        error: false,
        errorMessage: "",
        frozenRat: null,
        frozenRoom: null
      },
      roomId: params.roomId
    }
  } catch (error) {
    return redirect(302, `/${params.roomId}`)
  }
}
