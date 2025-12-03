import { get } from "svelte/store"
import { Hex } from "viem"
import { signMessage } from "viem/actions"
import type { SessionClient } from "drawbridge"
import { SignedRequest, SignedRequestInfo } from "@server/modules/types"
import { stringifyRequestForSignature } from "@server/modules/signature/stringifyRequestForSignature"
import { walletNetwork } from "$lib/modules/network"
import { getEstablishedConnectorClient } from "$lib/modules/drawbridge/connector"

export async function signRequest<T>(data: T): Promise<SignedRequest<T>> {
  const client = get(walletNetwork).walletClient

  const info: SignedRequestInfo = {
    timestamp: Date.now(),
    nonce: Math.floor(Math.random() * 1e12),
    calledFrom: await getCalledFrom()
  }

  let signature: Hex
  // SessionClient's signMessage method does not work as expected, requiring the use of its internal_signer
  if ("internal_signer" in client) {
    signature = await (client as unknown as SessionClient).internal_signer.signMessage({
      message: stringifyRequestForSignature({ data, info })
    })
  } else {
    signature = await signMessage(client as Parameters<typeof signMessage>[0], {
      account: client.account,
      message: stringifyRequestForSignature({ data, info })
    })
  }

  return {
    data,
    info,
    signature
  }
}

async function getCalledFrom(): Promise<Hex | null> {
  try {
    const connectorClient = await getEstablishedConnectorClient()
    if (!connectorClient) {
      return null
    }
    return connectorClient.account.address
  } catch {
    return null
  }
}
