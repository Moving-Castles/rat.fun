import {
  createPublicClient,
  createWalletClient,
  http,
  getContract,
  type Hex,
  type Chain,
  type Transport,
  type PublicClient,
  type WalletClient,
  type PrivateKeyAccount,
  type GetContractReturnType,
  type Address
} from "viem"
import { privateKeyToAccount, nonceManager } from "viem/accounts"
import { createWorld, type World } from "@latticexyz/recs"
import { encodeEntity, syncToRecs, type SyncToRecsResult } from "@latticexyz/store-sync/recs"
import { transportObserver } from "@latticexyz/common"
import { transactionQueue } from "@latticexyz/common/actions"

import { getNetworkConfig } from "./networkConfig"
import IWorldAbi from "../../../../contracts/out/IWorld.sol/IWorld.abi.json" with { type: "json" }
import mudConfig from "../../../../contracts/mud.config"

type recsSyncResult = SyncToRecsResult<typeof mudConfig, {}>

export interface SetupResult {
  world: World
  components: recsSyncResult["components"]
  playerEntity: ReturnType<typeof encodeEntity>
  publicClient: PublicClient<Transport, Chain>
  walletClient: WalletClient<Transport, Chain, PrivateKeyAccount>
  waitForTransaction: recsSyncResult["waitForTransaction"]
  worldContract: GetContractReturnType<
    typeof IWorldAbi,
    {
      public: PublicClient<Transport, Chain>
      wallet: WalletClient<Transport, Chain, PrivateKeyAccount>
    },
    Address
  >
}

export async function setupMud(
  privateKey: Hex,
  chainId: number,
  worldAddressOverride?: string
): Promise<SetupResult> {
  const networkConfig = await getNetworkConfig(chainId, worldAddressOverride)
  const world = createWorld()

  console.log(`Setting up MUD for chain ${chainId}...`)
  console.log(`World address: ${networkConfig.worldAddress}`)
  console.log(`Indexer URL: ${networkConfig.indexerUrl}`)

  const clientOptions = {
    chain: networkConfig.chain,
    transport: transportObserver(http(networkConfig.chain.rpcUrls.default.http[0])),
    pollingInterval: 1000
  } as const

  const publicClient = createPublicClient(clientOptions)

  const account = privateKeyToAccount(privateKey, { nonceManager })
  console.log(`Bot wallet address: ${account.address}`)

  const walletClient = createWalletClient({
    ...clientOptions,
    account
  }).extend(transactionQueue())

  const worldContract = getContract({
    address: networkConfig.worldAddress as Hex,
    abi: IWorldAbi,
    client: { public: publicClient, wallet: walletClient }
  })

  console.log("Syncing MUD state from indexer...")
  const { components, waitForTransaction, storedBlockLogs$ } = await syncToRecs({
    world,
    config: mudConfig,
    address: networkConfig.worldAddress as Hex,
    publicClient,
    startBlock: BigInt(networkConfig.initialBlockNumber),
    indexerUrl: networkConfig.indexerUrl
  })

  // Wait for initial sync to complete (wait for first block with logs)
  console.log("Waiting for initial state sync...")
  try {
    await new Promise<void>((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        subscription.unsubscribe()
        reject(new Error("Sync timeout"))
      }, 30000)

      const subscription = storedBlockLogs$.subscribe({
        next: (block: { blockNumber: bigint }) => {
          if (block.blockNumber > 0n) {
            clearTimeout(timeoutId)
            subscription.unsubscribe()
            resolve()
          }
        },
        error: err => {
          clearTimeout(timeoutId)
          reject(err)
        }
      })
    })
    console.log("MUD sync complete!")
  } catch (e) {
    console.log("Warning: Sync timeout, proceeding with available data...")
  }

  return {
    world,
    components,
    playerEntity: encodeEntity({ address: "address" }, { address: walletClient.account.address }),
    publicClient,
    walletClient,
    waitForTransaction,
    worldContract
  }
}
