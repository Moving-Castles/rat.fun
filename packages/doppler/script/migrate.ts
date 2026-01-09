import { createPublicClient, createWalletClient, Hex, http } from "viem"
import { privateKeyToAccount } from "viem/accounts"
import { airlockAbi, getAddresses } from "@whetstone-research/doppler-sdk"
import { Command } from "commander"
import dotenv from "dotenv"
import { readAuctionParams } from "../src/readAuctionParams"
import { getChain } from "@ratfun/common/basic-network"

dotenv.config()

const PRIVATE_KEY = process.env.PRIVATE_KEY as Hex
const RPC_URL_BASE = process.env.RPC_URL_BASE as string

if (!RPC_URL_BASE) {
  console.error("Error: RPC_URL_BASE not set in .env")
  process.exit(1)
}

const account = privateKeyToAccount(PRIVATE_KEY)

// Set up command line options
const program = new Command()
program
  .requiredOption("-c, --chain-id <CHAINID>", "Chain id", (val: string) => parseInt(val), 8453)
  .option("--dry-run", "Simulate the transaction without sending it")
  .parse(process.argv)

const options = program.opts()
const chainId: number = options.chainId
const dryRun: boolean = options.dryRun ?? false

const chain = getChain(chainId)
const transport = http(RPC_URL_BASE)

const publicClient = createPublicClient({
  chain,
  transport
})

const walletClient = createWalletClient({
  chain,
  transport,
  account
})

const auctionParams = await readAuctionParams(chain.id)
if (!auctionParams) throw new Error(`Auction params not found for chainId ${chain.id}`)

const addresses = getAddresses(chain.id)

// Log all relevant values
console.log("RPC URL:", RPC_URL_BASE)
console.log("Chain:", chain.name, `(${chain.id})`)
console.log("Airlock address:", addresses.airlock)
console.log("Token address:", auctionParams.token.address)
console.log("Token name:", auctionParams.token.name)
console.log("Token symbol:", auctionParams.token.symbol)
console.log("Sender:", account.address)
if (dryRun) {
  console.log("Mode: DRY RUN (no transaction will be sent)")
}
console.log("")

// Simulate the transaction first
console.log("Simulating transaction...")
try {
  await publicClient.simulateContract({
    address: addresses.airlock,
    abi: airlockAbi,
    functionName: "migrate",
    args: [auctionParams.token.address],
    account
  })
  console.log("Simulation successful!")
} catch (error) {
  console.error("Simulation failed:", error)
  process.exit(1)
}

if (dryRun) {
  console.log("")
  console.log("Dry run complete. No transaction was sent.")
  process.exit(0)
}

// Send the transaction
console.log("Sending transaction...")
const txHash = await walletClient.writeContract({
  address: addresses.airlock,
  abi: airlockAbi,
  functionName: "migrate",
  args: [auctionParams.token.address]
})

console.log("Transaction hash:", txHash)

// Wait for confirmation
console.log("Waiting for confirmation...")
const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash })

if (receipt.status === "success") {
  console.log("Transaction confirmed in block:", receipt.blockNumber)
} else {
  console.error("Transaction failed!")
  process.exit(1)
}
