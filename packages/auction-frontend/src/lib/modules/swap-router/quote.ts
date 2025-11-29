import { AuctionParams } from "doppler"
import { Hex } from "viem"
import { simulateContract } from "viem/actions"
import { get } from "svelte/store"
import { RatRouterAbi } from "contracts/externalAbis"
import { publicClient as publicClientStore } from "$lib/network"
import { userAddress } from "../drawbridge"
import { prepareSwapRouterPathArgs, ratRouterAddress } from "./currency"

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
