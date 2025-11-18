import {
  Account,
  Chain,
  Hex,
  maxUint128,
  maxUint256,
  parseEventLogs,
  PublicClient,
  Transport,
  WalletClient,
  zeroAddress
} from "viem"
import { CommandBuilder, V4ActionBuilder, V4ActionType } from "doppler-router"
import { getAddresses } from "@whetstone-research/doppler-sdk"
import { AuctionParams } from "./types"
import { getPoolKey } from "./getPoolKey"
import { Permit2PermitData, signPermit2 } from "./permit2"
import { CustomQuoter } from "./CustomQuoter"
import { swapAndReceiptEventsAbi, universalRouterAbi } from "./abis"
import { simulateContract } from "viem/actions"

export interface SwapExactParams {
  /** if false, give exact `amount` of numeraire, otherwise receive exact `amount` of tokens. Default false */
  isOut?: boolean
  permit?: Permit2PermitData
  permitSignature?: Hex
}

export function isPermitRequired(auctionParams: AuctionParams) {
  const poolKey = getPoolKey(auctionParams)
  const zeroForOne = !auctionParams.isToken0
  const swapFromNative = zeroForOne && poolKey.currency0 === zeroAddress
  return !swapFromNative
}

/**
 * Prepare permit2 data and its signature for numeraire swap via universal router
 */
export async function signPermit2ForUniversalRouter(
  publicClient: PublicClient<Transport, Chain>,
  walletClient: WalletClient<Transport, Chain, Account>,
  auctionParams: AuctionParams,
  amount: bigint,
  params: {
    isOut?: boolean
  }
) {
  const isOut = params.isOut ?? false

  const chainId = publicClient.chain.id
  const addresses = getAddresses(chainId)

  let amountIn: bigint
  if (isOut) {
    const quoter = new CustomQuoter(publicClient, chainId, auctionParams)
    const input = await quoter.quoteExactOutputV4(amount, true)

    amountIn = input.amountIn
  } else {
    amountIn = amount
  }

  return await signPermit2(
    publicClient,
    walletClient,
    auctionParams.numeraire.address,
    addresses.universalRouter,
    amountIn
  )
}

/**
 * Swap numeraire for token
 * @param amount exact amount in/out depending on `isOut`
 */
export async function swapExactSingle(
  publicClient: PublicClient<Transport, Chain>,
  walletClient: WalletClient<Transport, Chain, Account>,
  auctionParams: AuctionParams,
  amount: bigint,
  params: SwapExactParams
) {
  const isOut = params.isOut ?? false

  if (publicClient.chain.id !== walletClient.chain.id) {
    throw new Error("public and wallet client chains mismatch")
  }
  const chainId = publicClient.chain.id

  const addresses = getAddresses(chainId)

  let amountIn: bigint
  if (isOut) {
    const quoter = new CustomQuoter(publicClient, chainId, auctionParams)
    const input = await quoter.quoteExactOutputV4(amount, true)

    amountIn = input.amountIn
  } else {
    amountIn = amount
  }

  // Build poolKey and zeroForOne as in the quoting example
  const poolKey = getPoolKey(auctionParams)
  const zeroForOne = !auctionParams.isToken0

  // Build V4 swap actions
  const actionBuilder = new V4ActionBuilder()
  // TODO max/min amount out/in? (what's currently maxUint128/0n)
  if (isOut) {
    actionBuilder.addSwapExactOutSingle(poolKey, zeroForOne, amount, maxUint128, "0x")
  } else {
    actionBuilder.addSwapExactInSingle(poolKey, zeroForOne, amount, 0n, "0x")
  }
  // Settle and take ensures outputs are transferred correctly
  actionBuilder.addAction(V4ActionType.SETTLE_ALL, [
    zeroForOne ? poolKey.currency0 : poolKey.currency1,
    maxUint256
  ])
  actionBuilder.addAction(V4ActionType.TAKE_ALL, [
    zeroForOne ? poolKey.currency1 : poolKey.currency0,
    0n
  ])

  // If swapping native currency rather than an ERC20 token, skip permit and send value to router
  const swapFromNative = zeroForOne && poolKey.currency0 === zeroAddress

  const commandBuilder = new CommandBuilder()

  // Permit2
  if (!swapFromNative) {
    const permit = params.permit
    const permitSignature = params.permitSignature
    if (!permit || !permitSignature) {
      throw new Error("Missing required permit2 permit and signature")
    }
    commandBuilder.addPermit2Permit(permit, permitSignature)
  }

  // Encode Universal Router command
  const [actions, actionParams] = actionBuilder.build()
  commandBuilder.addV4Swap(actions, actionParams)
  const [commands, inputs] = commandBuilder.build()

  // Simulate to catch errors
  const { request } = await simulateContract(walletClient, {
    address: addresses.universalRouter,
    abi: [...universalRouterAbi, ...universalRouterErrors],
    functionName: "execute",
    args: [commands, inputs],
    // Send ETH when swapping from native currency
    value: swapFromNative ? amountIn : 0n
  })
  // Execute
  const txHash = await walletClient.writeContract(request)
  const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash })

  const parsedLogs = parseEventLogs({
    abi: swapAndReceiptEventsAbi,
    logs: receipt.logs
  })
  const swapLogs = parsedLogs.filter(
    ({ eventName, args }) => (eventName === "Swap" && args.liquidity > 0) || eventName === "Receipt"
  )
  return swapLogs
}

// Helps viem decode some common errors that aren't present in the abi
const universalRouterErrors = [
  {
    type: "error",
    name: "AllowanceExpired",
    inputs: [
      {
        name: "deadline",
        type: "uint256"
      }
    ]
  },
  {
    type: "error",
    name: "WrappedError",
    inputs: [
      {
        name: "target",
        type: "address"
      },
      {
        name: "selector",
        type: "bytes4"
      },
      {
        name: "reason",
        type: "bytes"
      },
      {
        name: "details",
        type: "bytes"
      }
    ]
  }
]
