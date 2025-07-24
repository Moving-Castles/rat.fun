import type { LayoutLoad } from "./$types"
import { getEnvironment, getWalletType } from "$lib/modules/network"

export const ssr = true

export const load: LayoutLoad = async ({ url }) => {
  const environment = getEnvironment(url)
  const walletType = getWalletType(url)

  return {
    environment: environment,
    walletType: walletType
  }
}
