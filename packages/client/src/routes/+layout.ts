import type { LayoutLoad } from "./$types"
import { WALLET_TYPE } from "$lib/mud/enums"
import { getEnvironment } from "$lib/modules/network"

export const prerender = "auto"
export const ssr = false

const getWalletType = (url: URL) => {
  const hostname = url.hostname

  if (hostname.includes("accountkit") || url.searchParams.has("accountkit")) {
    return WALLET_TYPE.ACCOUNTKIT
  }

  return WALLET_TYPE.BURNER
}

export const load: LayoutLoad = async ({ url }) => {
  const environment = getEnvironment(url)
  const walletType = getWalletType(url)

  return {
    environment: environment,
    walletType: walletType
  }
}
