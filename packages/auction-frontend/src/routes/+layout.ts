import type { LayoutLoad } from "./$types"
import { ENVIRONMENT, environment as environmentStore } from "$lib/network"

export const ssr = false
export const prerender = false

export const load: LayoutLoad = async () => {
  // Set environment (hardcoded to BASE for production auction)
  environmentStore.set(ENVIRONMENT.BASE)
}
