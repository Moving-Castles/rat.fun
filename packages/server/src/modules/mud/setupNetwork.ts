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
  getContract,
  Chain,
  Transport,
  Account,
  WalletClient,
  PublicClient,
  GetContractReturnType,
  Address,
  PrivateKeyAccount,
  nonceManager
} from "viem"
import { privateKeyToAccount } from "viem/accounts"
import { createWorld, World } from "@latticexyz/recs"
import { encodeEntity, syncToRecs, SyncToRecsResult } from "@latticexyz/store-sync/recs"
import { transportObserver } from "@latticexyz/common"
import { transactionQueue } from "@latticexyz/common/actions"

import { getNetworkConfig } from "./getNetworkConfig"
import { IWorldAbi } from "contracts/worldAbi"

/*
 * Import our MUD config, which includes strong types for
 * our tables and other config options. We use this to generate
 * things like RECS components and get back strong types for them.
 *
 * See https://mud.dev/templates/typescript/contracts#mudconfigts
 * for the source of this information.
 */
import mudConfig from "contracts/mud.config"

export type SetupNetworkResult = Awaited<ReturnType<typeof setupNetwork>>

type recsSyncResult = SyncToRecsResult<typeof mudConfig, {}>

export type SetupNetworkReturnType = {
  world: World
  components: recsSyncResult["components"]
  playerEntity: ReturnType<typeof encodeEntity>
  publicClient: PublicClient<Transport, Chain>
  walletClient: WalletClient<Transport, Chain, PrivateKeyAccount>
  latestBlock$: any
  storedBlockLogs$: any
  waitForTransaction: recsSyncResult["waitForTransaction"]
  worldContract: GetContractReturnType<
    typeof IWorldAbi,
    { public: PublicClient<Transport, Chain>; wallet: WalletClient<Transport, Chain, Account> },
    Address
  >
}

export async function setupNetwork(
  privateKey: string,
  chainId: number,
  transport?: Transport
): Promise<SetupNetworkReturnType> {
  const networkConfig = await getNetworkConfig(chainId)
  const world = createWorld()

  /*
   * Create a viem public (read only) client
   * (https://viem.sh/docs/clients/public.html)
   */
  const clientOptions = {
    chain: networkConfig.chain,
    transport: transportObserver(transport ?? chainTransport(networkConfig.chain.rpcUrls.default)),
    pollingInterval: 10000
  } as const satisfies ClientConfig

  const publicClient = createPublicClient(clientOptions)

  /*
   * Create a viem client for the account derived from the private key
   * (see https://viem.sh/docs/clients/wallet.html).
   */
  const walletClient = createWalletClient({
    ...clientOptions,
    account: privateKeyToAccount(privateKey as Hex, { nonceManager })
  }).extend(transactionQueue())

  /*
   * Create an object for communicating with the deployed World.
   */
  const worldContract = getContract({
    address: networkConfig.worldAddress as Hex,
    abi: IWorldAbi,
    client: { public: publicClient, wallet: walletClient }
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
    playerEntity: encodeEntity({ address: "address" }, { address: walletClient.account.address }),
    publicClient,
    walletClient,
    latestBlock$,
    storedBlockLogs$,
    waitForTransaction,
    worldContract
  }
}

function chainTransport(rpcUrls: Chain["rpcUrls"][string]): Transport {
  const webSocketUrl = rpcUrls?.webSocket?.[0]
  const httpUrl = rpcUrls?.http[0]

  if (webSocketUrl) {
    return httpUrl ? fallback([webSocket(webSocketUrl), http(httpUrl)]) : webSocket(webSocketUrl)
  }

  return http(httpUrl)
}
