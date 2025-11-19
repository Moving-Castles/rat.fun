/*
 * The MUD client code is built on top of viem
 * (https://viem.sh/docs/getting-started.html).
 * This line imports the functions we need from it.
 */
import { createPublicClient, fallback, http, Hex, ClientConfig, PublicClient, Transport, Chain, Block } from "viem"
import { Observable } from "rxjs"
import { transportObserver } from "@latticexyz/common"
import { StorageAdapterBlock } from "@latticexyz/store-sync";
import { syncToRecs, SyncToRecsResult } from "@latticexyz/store-sync/recs"
import { World } from "@latticexyz/recs"

import { ENVIRONMENT } from "../basic-network/enums"
import { getNetworkConfig } from "./getNetworkConfig"
import { world } from "./world"

/*
 * Import our MUD config, which includes strong types for
 * our tables and other config options. We use this to generate
 * things like RECS components and get back strong types for them.
 *
 * See https://mud.dev/templates/typescript/contracts#mudconfigts
 * for the source of this information.
 */
import mudConfig from "contracts/mud.config"

type recsSyncResult = SyncToRecsResult<typeof mudConfig, {}>

export type SetupPublicNetworkResult = {
  config: ReturnType<typeof getNetworkConfig>
  worldAddress: Hex
  world: World
  components: recsSyncResult["components"]
  publicClient: PublicClient<Transport, Chain>
  latestBlock$: Observable<Block>
  storedBlockLogs$: Observable<StorageAdapterBlock>
  waitForTransaction: recsSyncResult["waitForTransaction"]
  tableKeys: string[]
}

export async function setupPublicNetwork(environment: ENVIRONMENT, url: URL): Promise<SetupPublicNetworkResult> {
  const networkConfig = getNetworkConfig(environment, url)

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

  const resolvedConfig = {
    world,
    config: mudConfig,
    address: networkConfig.worldAddress as Hex,
    publicClient,
    startBlock: BigInt(networkConfig.initialBlockNumber),
    indexerUrl: networkConfig.indexerUrl
  }

  /*
   * Sync on-chain state into RECS and keeps our client in sync.
   * Uses the MUD indexer if available, otherwise falls back
   * to the viem publicClient to make RPC calls to fetch MUD
   * events from the chain.
   */
  const { components, latestBlock$, storedBlockLogs$, waitForTransaction } =
    await syncToRecs(resolvedConfig)

  // Allows us to to only listen to the game specific tables
  const tableKeys = [
    ...Object.keys(mudConfig.tables).map(key => key.split("__")[1]) // Strips everything before and including '__'
  ]

  return {
    config: networkConfig,
    worldAddress: networkConfig.worldAddress,
    world,
    components,
    publicClient,
    latestBlock$,
    storedBlockLogs$,
    waitForTransaction,
    tableKeys
  }
}
