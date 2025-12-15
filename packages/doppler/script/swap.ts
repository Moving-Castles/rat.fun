import { Hex } from "viem"
import { privateKeyToAccount } from "viem/accounts"
import { Command } from "commander"
import dotenv from "dotenv"
import { getChain } from "@ratfun/common/basic-network"
import { getClients } from "./utils/getClients"
import { readAuctionParams } from "../src/readAuctionParams"
import { swapWithLogs } from "./utils/swapWithLogs"

dotenv.config()

const PRIVATE_KEY = process.env.PRIVATE_KEY as Hex

const account = privateKeyToAccount(PRIVATE_KEY)

// Set up command line options
const program = new Command()
program
  .requiredOption("-c, --chain-id <CHAINID>", "Chain id", (val: string) => parseInt(val), 84532)
  .requiredOption("-n, --amount <AMOUNT>", "Token amount, not multiplied by decimals", (val: string) => parseFloat(val))
  .option("-o, --out", "Specify exact out amount, instead of exact in")
  .parse(process.argv)

const options = program.opts()

const chainId: number = options.chainId
const chain = getChain(chainId)

const isOut: boolean = options.out ?? false
const amount: number = options.amount

const { publicClient, walletClient } = getClients(account, chain)

const auctionParams = readAuctionParams(chain.id)
if (!auctionParams) throw new Error(`Auction params not found for chainId ${chain.id}`)

await swapWithLogs(publicClient, walletClient, auctionParams, amount, isOut)
