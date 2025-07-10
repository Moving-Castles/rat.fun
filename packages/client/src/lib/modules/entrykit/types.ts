import type { AppAccountClient } from "@latticexyz/account-kit/bundle"

export type AccountKitConnectReturn = {
  appAccountClient: AppAccountClient
  userAddress: string
}
