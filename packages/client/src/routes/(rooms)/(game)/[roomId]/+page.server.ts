import type { PageLoad } from "./$types"
import { loadData } from "$lib/modules/content/sanity"
import { queries } from "$lib/modules/content/sanity/groq"
import { errorHandler, CMSError } from "$lib/modules/error-handling"

export const ssr = true

export const load: PageLoad = async ({ params }) => {
  try {
    console.log("room content getting loaded")
    const roomContent = await loadData(queries.singleRoom, { id: params.roomId })

    return {
      roomContent
    }
  } catch (error) {
    console.log(error.message)
    errorHandler(new CMSError("Could not load data"))
  }
}
