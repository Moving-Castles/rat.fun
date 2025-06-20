import { PageLoad } from "./$types"
export const load: PageLoad = async ({ parent }) => {
  return { ...await parent() }
}