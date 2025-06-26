import { PageLoad } from "./$types"
import { redirect } from "@sveltejs/kit"
export const load: PageLoad = async ({ parent }) => {
  return redirect(302, "/rat")
}
