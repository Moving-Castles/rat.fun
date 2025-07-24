import type { PageLoad } from "./$types"
import { loadData } from "$lib/modules/content/sanity"
import { queries } from "$lib/modules/content/sanity/groq"
import { errorHandler, CMSError } from "$lib/modules/error-handling"

export const prerender = false

export const load: PageLoad = async ({ params }) => {
  try {
    const roomContent = await loadData(queries.singleRoom, { id: params.roomId })

    return {
      roomContent
    }
  } catch (error) {
    console.log(error.message)
    errorHandler(new CMSError("Could not load data"))
  }
}
