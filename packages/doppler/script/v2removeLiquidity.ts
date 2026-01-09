import { createPublicClient, createWalletClient, Hex, http, zeroAddress } from "viem"
import { privateKeyToAccount } from "viem/accounts"
import { Command } from "commander"
import { DopplerSDK } from "@whetstone-research/doppler-sdk"
import dotenv from "dotenv"
import { readAuctionParams } from "../src/readAuctionParams"
import { getChain } from "@ratfun/common/basic-network"
import {
  univ2getPairInfo,
  univ2getPairReserves,
  univ2removeLiquidity,
  univ2simulateRemoveLiquidity
} from "../src/uniswapv2"
import { getAssetData } from "../src/getAssetData"
import { balanceOf } from "../src/erc20"

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

const sdk = new DopplerSDK({
  publicClient,
  walletClient,
  chainId: chain.id
})

const auctionParams = await readAuctionParams(chain.id)
if (!auctionParams) throw new Error(`Auction params not found for chainId ${chain.id}`)

// Log basic info first
console.log("=== V2 Remove Liquidity ===")
console.log("")
console.log("RPC URL:", RPC_URL_BASE)
console.log("Chain:", chain.name, `(${chain.id})`)
console.log("Token:", auctionParams.token.symbol, `(${auctionParams.token.address})`)
console.log("Numeraire:", auctionParams.numeraire.symbol, `(${auctionParams.numeraire.address})`)
console.log("Sender:", account.address)
if (dryRun) {
  console.log("Mode: DRY RUN (no transaction will be sent)")
}
console.log("")

// Check auction timing
const now = Math.floor(Date.now() / 1000)
const auctionEnded = now >= auctionParams.endingTime
console.log("=== Auction Status ===")
console.log("Current time:", now, `(${new Date(now * 1000).toISOString()})`)
console.log(
  "Auction end time:",
  auctionParams.endingTime,
  `(${new Date(auctionParams.endingTime * 1000).toISOString()})`
)
console.log("Auction ended:", auctionEnded ? "YES" : "NO")
if (!auctionEnded) {
  const remaining = auctionParams.endingTime - now
  const days = Math.floor(remaining / 86400)
  const hours = Math.floor((remaining % 86400) / 3600)
  const minutes = Math.floor((remaining % 3600) / 60)
  console.log("Time remaining:", `${days}d ${hours}h ${minutes}m`)
}
console.log("")

// Fetch asset data
console.log("=== Migration Status ===")
const assetData = await getAssetData(publicClient, chain.id, auctionParams.token.address)
console.log("Migration pool address:", assetData.migrationPool)

const hasPoolAddress = assetData.migrationPool !== zeroAddress
console.log("Pool address set:", hasPoolAddress ? "YES" : "NO")

// Fetch pool info to check if migration actually happened
let pairReserves: { reserve0: bigint; reserve1: bigint; blockTimestampLast: number } = {
  reserve0: 0n,
  reserve1: 0n,
  blockTimestampLast: 0
}
let pairInfo: { token0: Hex; token1: Hex; totalSupply: bigint; decimals: number } = {
  token0: zeroAddress,
  token1: zeroAddress,
  totalSupply: 0n,
  decimals: 18
}

if (hasPoolAddress) {
  try {
    pairReserves = await univ2getPairReserves(publicClient, assetData.migrationPool)
    pairInfo = await univ2getPairInfo(publicClient, assetData.migrationPool)
  } catch (error) {
    console.log("Pool exists:", "NO (failed to fetch)")
  }
}

// Migration is only truly complete if pool has liquidity
const migrationDone = hasPoolAddress && pairInfo.totalSupply > 0n
console.log("Migration completed:", migrationDone ? "YES" : "NO (pool has no liquidity)")

if (!migrationDone) {
  console.log("")
  console.log("ERROR: Migration has not been completed yet.")
  console.log("")
  console.log("Prerequisites for v2removeLiquidity:")
  console.log("  1. Auction must have ended")
  console.log("  2. Migration must have been called (pnpm migrate --chain-id=8453)")
  console.log("")
  console.log("Current status:")
  console.log("  - Auction ended:", auctionEnded ? "YES" : "NO (waiting)")
  console.log("  - Migration done:", "NO (run migrate first after auction ends)")
  process.exit(1)
}
console.log("")

// Fetch hook info
console.log("=== Hook Info ===")
const dynamicAuction = await sdk.getDynamicAuction(auctionParams.hookAddress)
const hookInfo = await dynamicAuction.getHookInfo()
console.log("Total proceeds:", hookInfo.totalProceeds.toString())
console.log("")

// Log pool info
console.log("=== V2 Pool Info ===")
console.log("Token0:", pairInfo.token0)
console.log("Token1:", pairInfo.token1)
console.log("Reserve0:", pairReserves.reserve0.toString())
console.log("Reserve1:", pairReserves.reserve1.toString())
console.log("Total LP supply:", pairInfo.totalSupply.toString())
console.log("")

// 20% liquidity is expected to remain locked
const k = 20n

// Calculate removable liquidity
console.log("=== Liquidity Calculation ===")
const minNumeraireReserve = (hookInfo.totalProceeds * k) / 100n
const currentNumeraireReserve = auctionParams.isToken0
  ? pairReserves.reserve1
  : pairReserves.reserve0

console.log("Is token0:", auctionParams.isToken0)
console.log("Current numeraire reserve:", currentNumeraireReserve.toString())
console.log("Min numeraire reserve (20% of proceeds):", minNumeraireReserve.toString())

if (currentNumeraireReserve <= minNumeraireReserve) {
  console.log("")
  console.log("ERROR: Current numeraire reserve is not above minimum.")
  console.log("This means there isn't enough liquidity to remove while keeping 20% locked.")
  process.exit(1)
}

const removableLiquidity =
  ((currentNumeraireReserve - minNumeraireReserve) * pairInfo.totalSupply) / currentNumeraireReserve
console.log("Removable liquidity (LP tokens):", removableLiquidity.toString())
console.log("")

// Check wallet's LP balance
console.log("=== Your LP Balance ===")
const pairBalance = await balanceOf(
  publicClient,
  assetData.migrationPool,
  walletClient.account.address
)
console.log("Your LP balance:", pairBalance.toString())

if (pairBalance === 0n) {
  console.log("")
  console.log("ERROR: You have no LP tokens to remove.")
  process.exit(1)
}

// Determine how much to remove
let balanceToRemove
if (pairBalance <= removableLiquidity) {
  console.log("WARNING: Your balance is less than removable liquidity. Will remove entire balance.")
  balanceToRemove = pairBalance
} else {
  balanceToRemove = removableLiquidity
}
console.log("Balance to remove:", balanceToRemove.toString())

if (balanceToRemove < BigInt(1e9)) {
  console.log("")
  console.log("ERROR: Balance to remove is too low (dust protection).")
  process.exit(1)
}
console.log("")

// Simulate the transaction
console.log("=== Simulation ===")
console.log("Simulating transaction...")
try {
  await univ2simulateRemoveLiquidity(
    publicClient,
    walletClient,
    assetData.migrationPool,
    auctionParams.token.address,
    auctionParams.numeraire.address,
    balanceToRemove,
    walletClient.account.address
  )
  console.log("Simulation successful!")
} catch (error) {
  console.error("Simulation failed:", error)
  process.exit(1)
}

if (dryRun) {
  console.log("")
  console.log("=== Dry Run Complete ===")
  console.log("No transaction was sent.")
  process.exit(0)
}

// Send transaction to v2 router
console.log("")
console.log("=== Sending Transaction ===")
const txHash = await univ2removeLiquidity(
  publicClient,
  walletClient,
  assetData.migrationPool,
  auctionParams.token.address,
  auctionParams.numeraire.address,
  balanceToRemove,
  walletClient.account.address
)

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
