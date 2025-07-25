import type { PageLoad } from "./$types"
import { loadData } from "$lib/modules/content/sanity"
import { queries } from "$lib/modules/content/sanity/groq"
import { error, redirect } from "@sveltejs/kit"
import { CMSError } from "$lib/modules/error-handling"

export const load: PageLoad = async ({ params }) => {
  try {
    console.log("trying")
    const roomContent = await loadData(queries.singleRoom, { id: params.roomId })

    console.log("success")
    return {
      roomContent
    }
  } catch (err) {
    console.error(err)
    redirect(302, "/")
  }
}
