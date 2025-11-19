import { formatUnits, Hex } from "viem"
import { privateKeyToAccount } from "viem/accounts"
import { dopplerHookAbi, getAddresses } from "@whetstone-research/doppler-sdk"
import dotenv from "dotenv"
import { getAssetData, readAuctionParams, tickToPriceWithParams, univ4getSlot0 } from "../src"
import { getClients } from "./utils/getClients"
import { promptChain } from "./utils/promptChain"

dotenv.config()

const PRIVATE_KEY = process.env.PRIVATE_KEY as Hex

const account = privateKeyToAccount(PRIVATE_KEY)

const chain = promptChain()

const { publicClient, sdk } = getClients(account, chain)

const auctionParams = readAuctionParams(chain.id)
if (!auctionParams) throw new Error(`Auction params not found for chainId ${chain.id}`)

const isToken0 = await publicClient.readContract({
  address: auctionParams.hookAddress,
  abi: dopplerHookAbi,
  functionName: "isToken0"
})

const startingTick = await publicClient.readContract({
  address: auctionParams.hookAddress,
  abi: dopplerHookAbi,
  functionName: "startingTick"
})

const endingTick = await publicClient.readContract({
  address: auctionParams.hookAddress,
  abi: dopplerHookAbi,
  functionName: "endingTick"
})

const dynamicAuction = await sdk.getDynamicAuction(auctionParams.hookAddress)
const hookInfo = await dynamicAuction.getHookInfo()
const assetData = await getAssetData(publicClient, chain.id, auctionParams.token.address)
const slot0 = await univ4getSlot0(publicClient, auctionParams.poolId)

console.log("isToken0, ticks", isToken0, startingTick, endingTick)
console.log("hasGraduated", await dynamicAuction.hasGraduated())
console.log("hoookInfo", hookInfo)
console.log("assetData", assetData)
console.log("pool slot0", slot0)
console.log("totalProceeds", formatUnits(hookInfo.totalProceeds, auctionParams.numeraire.decimals))
console.log("totalTokensSold", formatUnits(hookInfo.totalTokensSold, auctionParams.token.decimals))
console.log(
  "curPrice",
  tickToPriceWithParams(await dynamicAuction.getCurrentPrice(), auctionParams)
)
console.log("starting", tickToPriceWithParams(startingTick, auctionParams))
console.log("ending", tickToPriceWithParams(endingTick, auctionParams))

console.log(await dynamicAuction.getCurrentPrice(), startingTick, endingTick)
