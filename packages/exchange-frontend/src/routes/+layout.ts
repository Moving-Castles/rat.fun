import type { LayoutLoad } from "./$types"
import { ENVIRONMENT, environment as environmentStore } from "$lib/network"

export const ssr = false
export const prerender = false

export const load: LayoutLoad = async () => {
  // Always BASE mainnet for exchange-frontend
  environmentStore.set(ENVIRONMENT.BASE)
}
