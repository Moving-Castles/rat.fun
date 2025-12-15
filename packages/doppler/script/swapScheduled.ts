import fs from "node:fs/promises"
import { Hex } from "viem"
import { privateKeyToAccount } from "viem/accounts"
import dotenv from "dotenv"
import { getChain } from "@ratfun/common/basic-network"
import { getClients } from "./utils/getClients"
import { readAuctionParams } from "../src/readAuctionParams"
import { getTestNumeraireTokens } from "../src/getTestNumeraireTokens"
import { swapWithLogs } from "./utils/swapWithLogs"

dotenv.config()

const PRIVATE_KEY = process.env.PRIVATE_KEY as Hex

const account = privateKeyToAccount(PRIVATE_KEY)

const chainId: number = 84532
const chain = getChain(chainId)

const { publicClient, walletClient } = getClients(account, chain)

const auctionParams = readAuctionParams(chain.id)
if (!auctionParams) throw new Error(`Auction params not found for chainId ${chain.id}`)

const txHash = await getTestNumeraireTokens(walletClient, 810_000n)
await publicClient.waitForTransactionReceipt({ hash: txHash })

const rows: {
  tokenBalanceBefore: string
  tokenBalanceAfter: string
  numeraireBalanceBefore: string
  numeraireBalanceAfter: string
  tokenDiff: number
  numeraireDiff: number
  effectivePrice: number
}[] = []

const intervalLength = 5000

let amount = 25000
let i = 0
let totalAmount = 0
let interval = setInterval(async () => {
  try {
    const result = await swapWithLogs(publicClient, walletClient, auctionParams, amount, false)

    rows.push(result)

    totalAmount += result.numeraireDiff

    if (i < 10) {
      amount = 150000
    } else if (totalAmount >= 785000) {
      amount = 5000
    } else {
      amount = 125000
    }
    i++
    if (i > 60) {
      throw new Error("stop")
    }
  } catch (e) {
    clearInterval(interval)
    console.log(e)

    const headers = Object.keys(rows[0]).join(",")
    const values = rows.map(row => Object.values(row).join(","))
    const csv = [headers, ...values].join("\n")
    await fs.writeFile("./swaplogs.csv", csv)
  }
}, intervalLength)
