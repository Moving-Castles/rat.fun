import { PageLoad } from "./$types"
import { redirect } from "@sveltejs/kit"
export const load: PageLoad = async ({ url }) => {
  return redirect(302, "/game" + `?${[...url.searchParams.keys()].join("&")}`)
}
