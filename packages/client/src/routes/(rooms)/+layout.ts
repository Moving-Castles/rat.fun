import type { LayoutLoad } from './$types';
import { ENVIRONMENT, WALLET_TYPE } from "$lib/mud/enums"

export const prerender = true
export const ssr = false

const getEnvironment = (url: URL) => {
  const hostname = url.hostname

  if (hostname.includes("pyrope") || url.searchParams.has("pyrope")) {
    return ENVIRONMENT.PYROPE
  }

  return ENVIRONMENT.DEVELOPMENT
}

const getWalletType = (url: URL) => {
  const hostname = url.hostname

  if(hostname.includes("accountkit") || url.searchParams.has("accountkit")) {
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