import { get } from "svelte/store"
import { Hex } from "viem"
import { walletType } from "$lib/modules/network"
import { WALLET_TYPE } from "$lib/mud/enums"
import { signMessage } from "viem/actions"
import { SessionClient } from "@latticexyz/entrykit/internal"
import { SignedRequest, SignedRequestInfo } from "@server/modules/types"
import { stringifyRequestForSignature } from "@server/modules/signature/stringifyRequestForSignature"
import { wagmiConfigStateful } from "$lib/modules/entry-kit/stores"
import { walletNetwork } from "$lib/modules/network"
import { getConnectorClient } from "@wagmi/core"
import { WagmiConfigUnavailableError } from "../error-handling"

export async function signRequest<T>(data: T): Promise<SignedRequest<T>> {
  const client = get(walletNetwork).walletClient

  const info: SignedRequestInfo = {
    timestamp: Date.now(),
    nonce: Math.floor(Math.random() * 1e12),
    calledFrom: await getCalledFrom()
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

async function getCalledFrom(): Promise<Hex | null> {
  const wagmiConfig = get(wagmiConfigStateful)
  if (!wagmiConfig) {
    throw new WagmiConfigUnavailableError()
  }

  if (get(walletType) === WALLET_TYPE.BURNER) return null

  const connectorClient = await getConnectorClient(wagmiConfig)
  console.log("connector client", connectorClient)
  if (!connectorClient) {
    return null
  }
  return connectorClient.account.address
}
