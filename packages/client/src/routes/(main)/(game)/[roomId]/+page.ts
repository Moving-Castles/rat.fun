import type { PageLoad } from "./$types"
import { loadData } from "$lib/modules/content/sanity"
import { queries } from "$lib/modules/content/sanity/groq"
import { redirect } from "@sveltejs/kit"
import { errorHandler, CMSError } from "$lib/modules/error-handling"

export const load: PageLoad = async ({ params }) => {
  try {
    const roomContent = await loadData(queries.singleRoom, { id: params.roomId })

    return {
      roomId: params.roomId,
      roomContent
    }
  } catch (err) {
    console.error(err)
    errorHandler(new CMSError("Could not load data"))
    redirect(302, "/")
  }
}
