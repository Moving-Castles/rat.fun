import type { PageLoad } from "./$types"
import { loadData } from "$lib/modules/content/sanity"
import { queries } from "$lib/modules/content/sanity/groq"
import { error, redirect } from "@sveltejs/kit"
import { CMSError } from "$lib/modules/error-handling"

export const ssr = false

export const load: PageLoad = async ({ params }) => {
  try {
    console.log("room content getting loaded")
    const roomContent = await loadData(queries.singleRoom, { id: params.roomId })

    if (!roomContent) {
      redirect(302, "/")
    }

    return {
      roomContent
    }
  } catch (e) {
    return error(500, new CMSError(e.message))
  }
}
