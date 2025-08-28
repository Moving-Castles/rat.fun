import type { LayoutLoad } from "./$types"
import { getEnvironmentFromUrl, getWalletTypeFromUrl } from "$lib/modules/network"
import { getNetworkConfig } from "$lib/mud/getNetworkConfig"
import { SALE_STATUS } from "$lib/mud/enums"
import { PUBLIC_SALE_STATUS } from "$env/static/public"

export const ssr = false
export const prerender = false

export const load: LayoutLoad = async ({ url }) => {
  // Pass all kinds of Network stuff to the main layout
  const environment = getEnvironmentFromUrl(url)
  const walletType = getWalletTypeFromUrl(url)
  const saleStatus = (PUBLIC_SALE_STATUS ?? SALE_STATUS.NOT_STARTED) as SALE_STATUS
  const networkConfig = getNetworkConfig(environment, url)

  return {
    environment: environment,
    walletType: walletType,
    saleStatus: saleStatus,
    networkConfig
  }
}
