import { Hex } from "viem"
import { privateKeyToAccount } from "viem/accounts"
import dotenv from "dotenv"
import { balanceOf, readAuctionParams } from "../src"
import { getClients } from "./utils/getClients"
import { promptChain } from "./utils/promptChain"

dotenv.config()

const PRIVATE_KEY = process.env.PRIVATE_KEY as Hex

const account = privateKeyToAccount(PRIVATE_KEY)

const chain = promptChain()

const { publicClient, walletClient } = getClients(account, chain)

const auctionParams = readAuctionParams(chain.id)
if (!auctionParams) throw new Error(`Auction params not found for chainId ${chain.id}`)

const numeraireBalance = await balanceOf(
  publicClient,
  auctionParams.numeraire.address,
  account.address
)

const txHash = await walletClient.writeContract({
  address: auctionParams.numeraire.address,
  abi: [
    {
      type: "function",
      name: "burn",
      inputs: [
        {
          name: "value",
          type: "uint256",
          internalType: "uint256"
        }
      ],
      outputs: [],
      stateMutability: "nonpayable"
    }
  ] as const,
  functionName: "burn",
  args: [numeraireBalance]
})
await publicClient.waitForTransactionReceipt({ hash: txHash })
