import dotenv from "dotenv"
import {
  Chain,
  createPublicClient,
  createWalletClient,
  getContract,
  GetContractReturnType,
  Hex,
  http,
  nonceManager,
  PrivateKeyAccount,
  PublicClient,
  Transport,
  WalletClient
} from "viem"
import { privateKeyToAccount } from "viem/accounts"
import { IWorldAbi } from "contracts/worldAbi"
import worldsJson from "contracts/worlds.json" with { type: "json" }
import { chain, rpcHttpUrl } from "./constants"

dotenv.config({ path: "../../packages/server/.env" })

const PRIVATE_KEY = process.env.PRIVATE_KEY as Hex

type PrivateKeyWalletClient = WalletClient<Transport, Chain, PrivateKeyAccount>
export type WorldContract = GetContractReturnType<
  typeof IWorldAbi,
  { public: PublicClient; wallet: PrivateKeyWalletClient }
>
export type SetupSimpleNetworkReturnType = {
  publicClient: PublicClient
  walletClient: PrivateKeyWalletClient
  worldContract: WorldContract
}

export function setupSimpleNetwork(): SetupSimpleNetworkReturnType {
  const publicClient = setupPublicClient()
  const walletClient = setupWalletClient()
  return {
    publicClient,
    walletClient,
    worldContract: getWorldContract(publicClient, walletClient)
  }
}

function setupPublicClient(): PublicClient {
  const transport = http(rpcHttpUrl)
  return createPublicClient({
    chain,
    transport
  }) as PublicClient
}

function setupWalletClient(): PrivateKeyWalletClient {
  const transport = http(rpcHttpUrl)
  return createWalletClient({
    chain,
    transport,
    account: privateKeyToAccount(PRIVATE_KEY as Hex, { nonceManager })
  })
}

function getWorldContract(
  publicClient: PublicClient,
  walletClient: PrivateKeyWalletClient
): WorldContract {
  const worldAddress = worldsJson[chain.id]?.address as Hex | undefined
  if (!worldAddress) throw new Error(`No world address for chain id ${chain.id}`)

  return getContract({
    address: worldAddress,
    abi: IWorldAbi,
    client: { public: publicClient, wallet: walletClient }
  })
}
