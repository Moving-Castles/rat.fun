import { Chain, createPublicClient, formatUnits, Hex, http } from "viem"
import { privateKeyToAccount } from "viem/accounts"
import dotenv from "dotenv"
import { balanceOf, getAssetData, readAuctionParams } from "../src"
import { promptChain } from "./utils/promptChain"

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

const tokenBalance = formatUnits(
  await balanceOf(publicClient, auctionParams.token.address, account.address),
  auctionParams.token.decimals
)
const numeraireBalance = formatUnits(
  await balanceOf(publicClient, auctionParams.numeraire.address, account.address),
  auctionParams.numeraire.decimals
)

console.log("token:", tokenBalance)
console.log("numeraire:", numeraireBalance)
console.log("univ2pair", await balanceOf(publicClient, assetData.migrationPool, account.address))
