import { get } from "svelte/store"
import { Hex } from "viem"
import { signMessage } from "viem/actions"
import { SessionClient } from "@latticexyz/entrykit/internal"
import { SignedRequest, SignedRequestInfo } from "@server/modules/types"
import { stringifyRequestForSignature } from "@server/modules/signature/stringifyRequestForSignature"
import { entryKitConnector } from "$lib/modules/entry-kit/stores"
import { walletNetwork } from "$lib/modules/network"

export async function signRequest<T>(data: T): Promise<SignedRequest<T>> {
  const client = get(walletNetwork).walletClient

  const info: SignedRequestInfo = {
    timestamp: Date.now(),
    nonce: Math.floor(Math.random() * 1e12),
    calledFrom: getCalledFrom()
  }

  let signature: Hex
  // TODO this is a workaround:
  // It's unknown whether the client is a SessionClient (entrykit is, burner isn't)
  // And SessionClient's signMessage method does not work as expected, requiring the use of its internal_signer
  if ("internal_signer" in client) {
    signature = await (client as SessionClient).internal_signer.signMessage({
      message: stringifyRequestForSignature({ data, info })
    })
  } else {
    signature = await signMessage(client, {
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

function getCalledFrom(): Hex | null {
  const connectorClient = get(entryKitConnector)
  console.log("connector client", connectorClient)
  if (!connectorClient) {
    return null
  }
  return connectorClient.account.address
}
