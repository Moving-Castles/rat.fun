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
// Revert to old way of importing to fix Docker build issue
import IWorldAbi from "../../../../contracts/out/IWorld.sol/IWorld.abi.json" with { type: "json" }
// import { IWorldAbi } from "contracts/worldAbi"

/*
 * Import our MUD config, which includes strong types for
 * our tables and other config options. We use this to generate
 * things like RECS components and get back strong types for them.
 *
 * See https://mud.dev/templates/typescript/contracts#mudconfigts
 * for the source of this information.
 */
// import mudConfig from "contracts/mud.config"
import mudConfig from "../../../../contracts/mud.config"

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
    pollingInterval: 1000
  } as const satisfies ClientConfig

  console.log("🔧 [MUD Setup] Polling interval configured:", clientOptions.pollingInterval, "ms")

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
  console.log("🗂️  [MUD Setup] Indexer URL:", networkConfig.indexerUrl || "not configured")

  const { components, latestBlock$, storedBlockLogs$, waitForTransaction } = await syncToRecs({
    world,
    config: mudConfig,
    address: networkConfig.worldAddress as Hex,
    publicClient,
    startBlock: BigInt(networkConfig.initialBlockNumber),
    indexerUrl: networkConfig.indexerUrl
  })

  // Add logging to track polling behavior
  // let lastPollTime = Date.now()
  // let blockUpdateCount = 0
  // let logUpdateCount = 0

  // latestBlock$.subscribe(block => {
  //   const now = Date.now()
  //   const timeSinceLastPoll = now - lastPollTime
  //   blockUpdateCount++
  //   console.log(
  //     `📊 [Blockchain Poll] Block update #${blockUpdateCount} | ` +
  //       `Block: ${block.number} | ` +
  //       `Time since last: ${timeSinceLastPoll}ms | ` +
  //       `Memory: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`
  //   )
  //   lastPollTime = now
  // })

  // storedBlockLogs$.subscribe(logs => {
  //   if (logs.logs.length > 0) {
  //     logUpdateCount++
  //     console.log(
  //       `📝 [Blockchain Logs] Log batch #${logUpdateCount} | ` +
  //         `Events: ${logs.logs.length} | ` +
  //         `Block: ${logs.blockNumber} | ` +
  //         `Memory: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`
  //     )
  //   }
  // })

  // console.log("✅ [MUD Setup] Observable logging enabled")

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

// Retry configuration for Alchemy RPC rate limits (429 errors)
const HTTP_RETRY_CONFIG = {
  retryCount: 5,
  retryDelay: 1000 // Base delay in ms, viem uses exponential backoff
} as const

function chainTransport(rpcUrls: Chain["rpcUrls"][string]): Transport {
  const webSocketUrl = rpcUrls?.webSocket?.[0]
  const httpUrl = rpcUrls?.http[0]

  let transport: Transport

  // Websocket is problematic due to memory spikes
  // We currently rely on HTTP polling by not having the websocket ENV variable set
  // Code is kept as is for the future...
  if (webSocketUrl) {
    console.log("🔌 [MUD Transport] Using WEBSOCKET transport")
    console.log("   WebSocket URL:", webSocketUrl)
    console.log("   Fallback HTTP:", httpUrl || "none")
    transport = httpUrl
      ? fallback([webSocket(webSocketUrl), http(httpUrl, HTTP_RETRY_CONFIG)])
      : webSocket(webSocketUrl)
  } else {
    console.log("🔌 [MUD Transport] Using HTTP POLLING transport")
    console.log("   HTTP URL:", httpUrl)
    console.log("   Retry config:", HTTP_RETRY_CONFIG)
    transport = http(httpUrl, HTTP_RETRY_CONFIG)
  }

  return transport
}
