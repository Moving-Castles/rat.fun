/*
 * The MUD client code is built on top of viem
 * (https://viem.sh/docs/getting-started.html).
 * This line imports the functions we need from it.
 */
import {
  createPublicClient,
  fallback,
  webSocket,
  http,
  createWalletClient,
  Hex,
  ClientConfig,
  getContract
} from "viem"
import { encodeEntity, syncToRecs } from "@latticexyz/store-sync/recs"

import { getNetworkConfig } from "./getNetworkConfig"
import { world } from "./world"
import IWorldAbi from "../../../../contracts/out/IWorld.sol/IWorld.abi.json"
import { createBurnerAccount, transportObserver } from "@latticexyz/common"
import { transactionQueue } from "@latticexyz/common/actions"

/*
 * Import our MUD config, which includes strong types for
 * our tables and other config options. We use this to generate
 * things like RECS components and get back strong types for them.
 *
 * See https://mud.dev/templates/typescript/contracts#mudconfigts
 * for the source of this information.
 */
import mudConfigImport from "../../../../contracts/mud.config"
const mudConfig = (mudConfigImport as any).default || mudConfigImport

export type SetupNetworkResult = Awaited<ReturnType<typeof setupNetwork>>

export type SetupNetworkReturnType = {
  world: typeof world
  components: any
  playerEntity: ReturnType<typeof encodeEntity>
  publicClient: ReturnType<typeof createPublicClient>
  walletClient: ReturnType<typeof createWalletClient>
  latestBlock$: any
  storedBlockLogs$: any
  waitForTransaction: any
  worldContract: ReturnType<typeof getContract>
}

export async function setupNetwork(
  privateKey: string,
  chainId: number
): Promise<SetupNetworkReturnType> {
  const networkConfig = await getNetworkConfig(privateKey, chainId)

  /*
   * Create a viem public (read only) client
   * (https://viem.sh/docs/clients/public.html)
   */
  const transports = []

  // Add WebSocket transport if WebSocket URL is available
  if (
    "webSocket" in networkConfig.chain.rpcUrls.default &&
    networkConfig.chain.rpcUrls.default.webSocket?.[0]
  ) {
    transports.push(webSocket(networkConfig.chain.rpcUrls.default.webSocket[0]))
  }

  // Always add HTTP transport as fallback
  transports.push(http(networkConfig.chain.rpcUrls.default.http[0]))

  const clientOptions = {
    chain: networkConfig.chain,
    transport: transportObserver(fallback(transports)),
    pollingInterval: 1000
  } as const satisfies ClientConfig

  const publicClient = createPublicClient(clientOptions)

  /*
   * Create a temporary wallet and a viem client for it
   * (see https://viem.sh/docs/clients/wallet.html).
   */
  const burnerAccount = createBurnerAccount(networkConfig.privateKey as Hex)
  const burnerWalletClient = createWalletClient({
    ...clientOptions,
    account: burnerAccount
  }).extend(transactionQueue())

  /*
   * Create an object for communicating with the deployed World.
   */
  const worldContract = getContract({
    address: networkConfig.worldAddress as Hex,
    abi: IWorldAbi,
    client: { public: publicClient, wallet: burnerWalletClient }
  })

  /*
   * Sync on-chain state into RECS and keeps our client in sync.
   * Uses the MUD indexer if available, otherwise falls back
   * to the viem publicClient to make RPC calls to fetch MUD
   * events from the chain.
   */
  const { components, latestBlock$, storedBlockLogs$, waitForTransaction } = await syncToRecs({
    world,
    config: mudConfig,
    address: networkConfig.worldAddress as Hex,
    publicClient,
    startBlock: BigInt(networkConfig.initialBlockNumber)
  })

  return {
    world,
    components,
    playerEntity: encodeEntity(
      { address: "address" },
      { address: burnerWalletClient.account.address }
    ),
    publicClient,
    walletClient: burnerWalletClient,
    latestBlock$,
    storedBlockLogs$,
    waitForTransaction,
    worldContract
  }
}
