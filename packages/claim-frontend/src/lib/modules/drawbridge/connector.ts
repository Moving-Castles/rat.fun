import { watchAsset } from "viem/actions"
import { get } from "svelte/store"
import { getDrawbridge } from "$lib/modules/drawbridge"
import { networkConfig } from "$lib/network"
import { NetworkNotInitializedError } from "$lib/modules/error-handling"

/**
 * Prompts the user's wallet to add the RAT token to their token list (EIP-747)
 */
export async function addRatTokenToWallet(): Promise<boolean> {
  const config = get(networkConfig)
  if (!config) {
    throw new NetworkNotInitializedError()
  }

  const connectorClient = await getDrawbridge().getConnectorClient()

  return watchAsset(connectorClient, {
    type: "ERC20",
    options: {
      address: config.ratTokenAddress,
      symbol: "RAT",
      decimals: 18
    }
  })
}
