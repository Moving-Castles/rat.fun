import { get } from "svelte/store"
import { Hex } from "viem"
import { signMessage } from "viem/actions"
import { SignedRequest, SignedRequestInfo } from "@server/modules/types"
import { stringifyRequestForSignature } from "@server/modules/signature/stringifyRequestForSignature"
import { store as accountKitStore } from "@latticexyz/account-kit/bundle"
import { walletNetwork } from "$lib/modules/network"

export async function signRequest<T>(data: T): Promise<SignedRequest<T>> {
  const client = get(walletNetwork).walletClient

  const info: SignedRequestInfo = {
    timestamp: Date.now(),
    nonce: Math.floor(Math.random() * 1e12),
    calledFrom: getCalledFrom(),
  }

  const signature = await signMessage(client, {
    account: client.account,
    message: stringifyRequestForSignature({ data, info }),
  })

  return {
    data,
    info,
    signature,
  }
}

function getCalledFrom(): Hex | null {
  // Without account-kit there should only be one client, so no delegation is possible
  const userAccountClient = accountKitStore?.getState()?.userAccountClient
  if (!userAccountClient) {
    return null
  }

  return userAccountClient.account.address
}
