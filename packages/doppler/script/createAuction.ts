import fs from "node:fs/promises"
import { Hex } from "viem"
import { privateKeyToAccount } from "viem/accounts"
import { computePoolId, dopplerHookAbi } from "@whetstone-research/doppler-sdk"
import dotenv from "dotenv"
import { buildAuctionParams } from "../src/buildAuctionParams"
import { auctionParamsFilePath } from "../src/constants"
import { CustomDopplerFactory } from "../src/CustomDopplerFactory"
import { getDecimals, getName, getSymbol } from "../src/erc20"
import { getPoolKey } from "../src/getPoolKey"
import { AuctionParams } from "../src/types"
import { getClients } from "./utils/getClients"
import { promptChain } from "./utils/promptChain"

dotenv.config()

const PRIVATE_KEY = process.env.PRIVATE_KEY as Hex

const account = privateKeyToAccount(PRIVATE_KEY)

const chain = promptChain()

const { publicClient, walletClient } = getClients(account, chain)

const factory = new CustomDopplerFactory(publicClient, walletClient as any, chain.id)

const createParams = await buildAuctionParams(publicClient, account, chain.id)
const result = await factory.createDynamicAuction(createParams)

console.log("txHash", result.transactionHash)
console.log("hookAddress", result.hookAddress)
console.log("tokenAddress", result.tokenAddress)

// Wait for transaction receipt
await publicClient.waitForTransactionReceipt({ hash: result.transactionHash as Hex })
await new Promise(resolve => setTimeout(resolve, 10000))

const startingTime = await publicClient.readContract({
  address: result.hookAddress,
  abi: dopplerHookAbi,
  functionName: "startingTime"
})
const endingTime = await publicClient.readContract({
  address: result.hookAddress,
  abi: dopplerHookAbi,
  functionName: "endingTime"
})
const isToken0 = await publicClient.readContract({
  address: result.hookAddress,
  abi: dopplerHookAbi,
  functionName: "isToken0"
})
const startingTick = await publicClient.readContract({
  address: result.hookAddress,
  abi: dopplerHookAbi,
  functionName: "startingTick"
})
const endingTick = await publicClient.readContract({
  address: result.hookAddress,
  abi: dopplerHookAbi,
  functionName: "endingTick"
})

const auctionParams: AuctionParams = {
  poolId: result.poolId as Hex,
  transactionHash: result.transactionHash as Hex,
  hookAddress: result.hookAddress,
  token: {
    address: result.tokenAddress,
    decimals: 18,
    name: createParams.token.name,
    symbol: createParams.token.symbol
  },
  numeraire: {
    address: createParams.sale.numeraire,
    decimals: await getDecimals(publicClient, createParams.sale.numeraire),
    name: await getName(publicClient, createParams.sale.numeraire),
    symbol: await getSymbol(publicClient, createParams.sale.numeraire)
  },
  startingTime: Number(startingTime),
  endingTime: Number(endingTime),
  isToken0,
  startingTick,
  endingTick,
  pool: createParams.pool,
  userAddress: createParams.userAddress,
  spendLimitAmount: createParams.token.spendLimitAmount.toString()
}

// TODO remove after result.poolId is fixed https://github.com/whetstoneresearch/doppler-sdk-alpha/pull/36
auctionParams.poolId = computePoolId(getPoolKey(auctionParams))

async function getAuctionParamsAllChains(): Promise<Record<number, unknown>> {
  try {
    const file = await fs.readFile(auctionParamsFilePath, "utf-8")
    return JSON.parse(file)
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      return {}
    } else {
      throw error
    }
  }
}

const auctionParamsAllChains = await getAuctionParamsAllChains()
auctionParamsAllChains[chain.id] = auctionParams
await fs.writeFile(auctionParamsFilePath, JSON.stringify(auctionParamsAllChains, null, 2) + "\n")
