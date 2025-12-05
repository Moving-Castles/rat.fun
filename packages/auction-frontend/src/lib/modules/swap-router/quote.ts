import { AuctionParams } from "doppler"
import { decodeErrorResult, encodePacked, formatUnits, Hex, parseUnits } from "viem"
import { simulateContract, readContract } from "viem/actions"
import { get } from "svelte/store"
import { RatRouterAbi } from "contracts/externalAbis"
import { publicClient as publicClientStore } from "$lib/network"
import { userAddress } from "../drawbridge"
import { prepareSwapRouterPathArgs, ratRouterAddress, eurcCurrency, usdcCurrency } from "./currency"

// Common errors from Uniswap V4 quoter and doppler hook
const quoterErrors = [
  {
    type: "error",
    name: "UnexpectedRevertBytes",
    inputs: [{ name: "revertData", type: "bytes" }]
  },
  { type: "error", name: "BuyLimitExceeded", inputs: [] },
  { type: "error", name: "MintingNotStartedYet", inputs: [] },
  { type: "error", name: "NoCountryCode", inputs: [] },
  { type: "error", name: "PoolLocked", inputs: [] },
  { type: "error", name: "OnlyMintAllowed", inputs: [] },
  { type: "error", name: "InsufficientBalance", inputs: [] },
  { type: "error", name: "NotEnoughLiquidity", inputs: [{ name: "poolId", type: "bytes32" }] }
] as const

/**
 * Try to decode a nested error from UnexpectedRevertBytes
 */
export function decodeQuoterError(error: unknown): string {
  if (!(error instanceof Error)) return String(error)

  // Try to extract error data from various locations viem might put it
  const err = error as {
    data?: Hex
    cause?: { data?: Hex; raw?: Hex; signature?: Hex }
  }

  // viem stores raw revert data in cause.raw
  let errorData: Hex | undefined = err.cause?.raw ?? err.data ?? err.cause?.data

  console.log("[decodeQuoterError] Raw error data:", errorData)

  if (!errorData) return error.message

  try {
    // First try to decode as UnexpectedRevertBytes
    const decoded = decodeErrorResult({
      abi: quoterErrors,
      data: errorData
    })

    if (decoded.errorName === "UnexpectedRevertBytes" && decoded.args?.[0]) {
      const nestedData = decoded.args[0] as Hex
      console.log("[decodeQuoterError] Nested error data:", nestedData)
      // Try to decode the nested error
      try {
        const nestedDecoded = decodeErrorResult({
          abi: quoterErrors,
          data: nestedData
        })
        return `${nestedDecoded.errorName}${nestedDecoded.args?.length ? `: ${nestedDecoded.args.join(", ")}` : ""}`
      } catch {
        // Couldn't decode nested, return selector
        const selector = nestedData.slice(0, 10)
        return `UnexpectedRevertBytes (nested selector: ${selector})`
      }
    }

    return `${decoded.errorName}${decoded.args?.length ? `: ${decoded.args.join(", ")}` : ""}`
  } catch {
    return error.message
  }
}

const aerodromeQuoterAbi = [
  {
    type: "function",
    name: "quoteExactInput",
    inputs: [
      { name: "path", type: "bytes" },
      { name: "amountIn", type: "uint256" }
    ],
    outputs: [
      { name: "amountOut", type: "uint256" },
      { name: "sqrtPriceX96AfterList", type: "uint160[]" },
      { name: "initializedTicksCrossedList", type: "uint32[]" },
      { name: "gasEstimate", type: "uint256" }
    ],
    stateMutability: "nonpayable"
  }
] as const

export async function quoteExactIn(
  fromCurrencyAddress: Hex,
  auctionParams: AuctionParams,
  amountIn: bigint
) {
  const publicClient = get(publicClientStore)
  if (!publicClient) throw new Error("Network not initialized")

  const { result } = await simulateContract(publicClient, {
    address: ratRouterAddress,
    abi: RatRouterAbi,
    functionName: "quoteExactIn",
    args: [amountIn, ...prepareSwapRouterPathArgs(fromCurrencyAddress, auctionParams, false)],
    account: get(userAddress)
  })
  const [amountOutFinal, amountInUniswap]: [bigint, bigint] = result
  return {
    amountOutFinal,
    amountInUniswap
  }
}

/**
 * Get the EURC to USDC exchange rate from Aerodrome
 * Returns how many USDC you get for 1 EURC
 */
export async function getEurcToUsdcRate(): Promise<number> {
  const publicClient = get(publicClientStore)
  if (!publicClient) throw new Error("Network not initialized")

  // Get the Aerodrome quoter address from RatRouter
  const aerodromeQuoterAddress = (await readContract(publicClient, {
    address: ratRouterAddress,
    abi: RatRouterAbi,
    functionName: "aerodromeQuoter"
  })) as Hex

  // Encode path: EURC → USDC (tickSpacing 50 for the EURC/USDC pool)
  const eurcToUsdcPath = encodePacked(
    ["address", "int24", "address"],
    [eurcCurrency.address, 50, usdcCurrency.address]
  )

  // Quote 1 EURC
  const oneEurc = parseUnits("1", eurcCurrency.decimals)

  const { result } = await simulateContract(publicClient, {
    address: aerodromeQuoterAddress,
    abi: aerodromeQuoterAbi,
    functionName: "quoteExactInput",
    args: [eurcToUsdcPath, oneEurc]
  })

  const [amountOut] = result
  return Number(formatUnits(amountOut, usdcCurrency.decimals))
}

export async function quoteExactOut(
  fromCurrencyAddress: Hex,
  auctionParams: AuctionParams,
  amountOut: bigint
) {
  const publicClient = get(publicClientStore)
  if (!publicClient) throw new Error("Network not initialized")

  const { result } = await simulateContract(publicClient, {
    address: ratRouterAddress,
    abi: RatRouterAbi,
    functionName: "quoteExactOut",
    args: [amountOut, ...prepareSwapRouterPathArgs(fromCurrencyAddress, auctionParams, true)],
    account: get(userAddress)
  })
  const [amountInInitial, amountInUniswap]: [bigint, bigint] = result
  return {
    amountInInitial,
    amountInUniswap
  }
}
