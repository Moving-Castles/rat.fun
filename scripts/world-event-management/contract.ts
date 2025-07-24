import { createWalletClient, http, createPublicClient } from "viem"
import { privateKeyToAccount } from "viem/accounts"
import dotenv from "dotenv"
import { WorldEvent } from "./types"
import { anvil } from "viem/chains"
import type { Abi } from "viem"
import IWorldAbiJson from "../../packages/contracts/out/IWorld.sol/IWorld.abi.json"

const IWorldAbi = IWorldAbiJson as Abi

dotenv.config({ path: require("path").resolve(__dirname, "../.env") })

// Load private key and RPC URL from environment
const PRIVATE_KEY = process.env.PRIVATE_KEY as string
const RPC_URL = process.env.RPC_URL as string
const CONTRACT_ADDRESS = process.env.WORLD_ADDRESS as `0x${string}`

if (!PRIVATE_KEY) throw new Error("PRIVATE_KEY not set in .env")
if (!RPC_URL) throw new Error("RPC_URL not set in .env")
if (!CONTRACT_ADDRESS) throw new Error("CONTRACT_ADDRESS not set in .env")

const publicClient = createPublicClient({ transport: http(RPC_URL) })

export async function callSetWorldEvent(event: WorldEvent) {
  const account = privateKeyToAccount(PRIVATE_KEY as `0x${string}`)
  const client = createWalletClient({
    account,
    chain: anvil,
    transport: http(RPC_URL)
  })
  const txHash = await client.writeContract({
    address: CONTRACT_ADDRESS,
    abi: IWorldAbi,
    functionName: "ratfun__setWorldEvent",
    args: [
      event.id,
      event.activation.publicTitle,
      event.activation.prompt,
      BigInt(event.activation.duration)
    ]
  })

  console.log("tx hash", txHash)
  const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash })
  console.log("Transaction confirmed in block", receipt.blockNumber)
  return true
}

export async function callRemoveWorldEvent() {
  const account = privateKeyToAccount(PRIVATE_KEY as `0x${string}`)
  const client = createWalletClient({
    account,
    chain: anvil,
    transport: http(RPC_URL)
  })
  const txHash = await client.writeContract({
    address: CONTRACT_ADDRESS,
    abi: IWorldAbi,
    functionName: "ratfun__removeWorldEvent"
  })
  console.log("tx hash", txHash)
  const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash })
  console.log("Transaction confirmed in block", receipt.blockNumber)
  return true
}
