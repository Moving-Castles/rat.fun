import { Command } from "commander"
import { createPublicClient, http, Chain, parseUnits } from "viem"
import { getChain } from "@ratfun/common/basic-network"
import { readAuctionParams } from "../src/readAuctionParams"
import { CustomQuoter } from "../src/CustomQuoter"

// Set up command line options
const program = new Command()
program
  .requiredOption("-c, --chain-id <CHAINID>", "Chain id", (val: string) => parseInt(val), 84532)
  .requiredOption("-n, --amount <AMOUNT>", "Token amount, not multiplied by decimals")
  .option("-o, --out", "Specify exact out amount, instead of exact in")
  .parse(process.argv)

const options = program.opts()

const chainId: number = options.chainId
const chain = getChain(chainId)

const isOut: boolean = options.out ?? false
const amount: string = options.amount

const publicClient = createPublicClient({
  chain: chain as Chain,
  transport: http()
})

const auctionParams = readAuctionParams(chain.id)
if (!auctionParams) throw new Error(`Auction params not found for chainId ${chain.id}`)

const quoter = new CustomQuoter(publicClient, chain.id, auctionParams)
console.log("isToken0", quoter.isToken0)
const zeroForOne = quoter.zeroForOne(true)
console.log("zeroForOne", zeroForOne)
const inputDecimals = quoter.inputDecimals(zeroForOne)
const outputDecimals = quoter.outputDecimals(zeroForOne)

let inputAmount
let outputAmount
if (isOut) {
  outputAmount = amount
  const input = await quoter.quoteExactOutputV4(parseUnits(outputAmount, outputDecimals), true)
  inputAmount = input.formattedAmount

  console.log("input:", inputAmount)
  console.log("exact output:", outputAmount)
} else {
  inputAmount = amount
  const output = await quoter.quoteExactInputV4(parseUnits(inputAmount, inputDecimals), true)
  outputAmount = output.formattedAmount

  console.log("exact input:", inputAmount)
  console.log("output:", outputAmount)
}

const lens = await quoter.quoteExactInputV4Lens(parseUnits(inputAmount, inputDecimals), true)
const lensTokenAmount = lens.isToken0 ? lens.formattedAmount0 : lens.formattedAmount1
const lensNumeraireAmount = lens.isToken0 ? lens.formattedAmount1 : lens.formattedAmount0
console.log("lens token:", lensTokenAmount)
console.log("lens numeraire:", lensNumeraireAmount)
