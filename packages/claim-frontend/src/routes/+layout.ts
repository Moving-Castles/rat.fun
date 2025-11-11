import type { LayoutLoad } from "./$types"
import { ENVIRONMENT, WALLET_TYPE } from "$lib/mud/enums"
import {
  environment as environmentStore,
  walletType as walletTypeStore
} from "$lib/modules/network"

export const ssr = false
export const prerender = false

export const load: LayoutLoad = async () => {
  // Always BASE mainnet
  environmentStore.set(ENVIRONMENT.BASE)
  // Always ENTRYKIT wallet type
  walletTypeStore.set(WALLET_TYPE.ENTRYKIT)
}
