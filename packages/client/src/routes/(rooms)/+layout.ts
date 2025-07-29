import type { LayoutLoad } from "./$types"

export const prerender = false

export const load: LayoutLoad = async ({ parent }) => {
  return await parent()
}
