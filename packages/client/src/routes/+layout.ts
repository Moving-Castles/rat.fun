import type { LayoutLoad } from "./$types"
import { getEnvironment, getWalletType } from "$lib/modules/network"

export const prerender = "auto"
export const ssr = false

export const load: LayoutLoad = async ({ url }) => {
  const environment = getEnvironment(url)
  const walletType = getWalletType(url)

  console.log("Found wallet type", walletType)

  return {
    environment: environment,
    walletType: walletType
  }
}
