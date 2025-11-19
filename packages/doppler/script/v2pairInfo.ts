import { Chain, createPublicClient, formatUnits, Hex, http } from "viem"
import { privateKeyToAccount } from "viem/accounts"
import dotenv from "dotenv"
import { readAuctionParams } from "../src/readAuctionParams"
import { promptChain } from "./utils/promptChain"
import { getAssetData } from "../src/getAssetData"
import {
  univ2getPairInfo,
  univ2getPairReserves,
  v2LockerGetAddress,
  v2LockerGetPoolState
} from "../src/uniswapv2"
import { balanceOf } from "../src/erc20"

dotenv.config()

const PRIVATE_KEY = process.env.PRIVATE_KEY as Hex

const account = privateKeyToAccount(PRIVATE_KEY)

const chain = promptChain()

const publicClient = createPublicClient({
  chain: chain as Chain,
  transport: http()
})

const auctionParams = readAuctionParams(chain.id)
if (!auctionParams) throw new Error(`Auction params not found for chainId ${chain.id}`)

const assetData = await getAssetData(publicClient, chain.id, auctionParams.token.address)

const pairReserves = await univ2getPairReserves(publicClient, assetData.migrationPool)
const { reserve0, reserve1 } = pairReserves
const pairInfo = await univ2getPairInfo(publicClient, assetData.migrationPool)
const { token0, token1 } = pairInfo

if (auctionParams.isToken0 && token0 !== auctionParams.token.address) {
  throw new Error(`Unexpected token0 ${token0}`)
}
if (auctionParams.isToken0 && token1 !== auctionParams.numeraire.address) {
  throw new Error(`Unexpected token1 ${token1}`)
}
if (!auctionParams.isToken0 && token1 !== auctionParams.token.address) {
  throw new Error(`Unexpected token1 ${token1}`)
}
if (!auctionParams.isToken0 && token0 !== auctionParams.numeraire.address) {
  throw new Error(`Unexpected token0 ${token0}`)
}

const tokenReserve = auctionParams.isToken0 ? reserve0 : reserve1
const numeraireReserve = auctionParams.isToken0 ? reserve1 : reserve0

console.log(pairReserves)
console.log(pairInfo)

console.log("token reserve", formatUnits(tokenReserve, auctionParams.token.decimals))
console.log("numeraire reserve", formatUnits(numeraireReserve, auctionParams.numeraire.decimals))

const accountPairBalance = await balanceOf(publicClient, assetData.migrationPool, account.address)
console.log("current account pair balance", accountPairBalance)

const locker = await v2LockerGetAddress(publicClient)
const lockerPairBalance = await balanceOf(publicClient, assetData.migrationPool, locker)
console.log("current locker pair balance", lockerPairBalance)
console.log(
  "migration locker state",
  await v2LockerGetPoolState(publicClient, locker, assetData.migrationPool)
)
