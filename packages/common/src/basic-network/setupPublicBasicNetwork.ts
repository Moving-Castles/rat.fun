import { createPublicClient, fallback, http, ClientConfig, PublicClient, Transport, Chain } from "viem"
import { transportObserver } from "@latticexyz/common"
import { getBasicNetworkConfig } from "./getBasicNetworkConfig"
import { ENVIRONMENT } from "./enums"

export type SetupPublicBasicNetworkResult = {
  publicClient: PublicClient<Transport, Chain>
}

export async function setupPublicBasicNetwork(environment: ENVIRONMENT, url: URL): Promise<SetupPublicBasicNetworkResult> {
  const networkConfig = getBasicNetworkConfig(environment, url)

  /*
   * Create a viem public (read only) client
   * (https://viem.sh/docs/clients/public.html)
   */
  const transports = [http(networkConfig.provider.jsonRpcUrl)]

  const clientOptions = {
    chain: networkConfig.chain,
    transport: transportObserver(fallback(transports)),
    pollingInterval: 2000
  } as const satisfies ClientConfig

  const publicClient = createPublicClient(clientOptions)

  return {
    publicClient,
  }
}
