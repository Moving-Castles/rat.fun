import type { LayoutLoad } from "./$types"

export const load: LayoutLoad = async ({ parent }) => {
  return await parent()
}
