import { AuctionParams, Permit2PermitData } from "doppler"
import { Hex } from "viem"
import { RatRouterAbi } from "contracts/externalAbis"
import { prepareConnectorClientForTransaction } from "../drawbridge/connector"
import { prepareSwapRouterPathArgs, ratRouterAddress, wethCurrency } from "./currency"

export async function swapExactIn(
  fromCurrencyAddress: Hex,
  auctionParams: AuctionParams,
  amountIn: bigint,
  permit?: Permit2PermitData,
  permitSignature?: Hex
) {
  const client = await prepareConnectorClientForTransaction()

  if (fromCurrencyAddress === wethCurrency.address) {
    const nowSec = BigInt(Math.floor(Date.now() / 1000))
    const deadline = nowSec + 3600n

    // Execute swap with ETH
    return await client.writeContract({
      address: ratRouterAddress,
      abi: RatRouterAbi,
      functionName: "swapExactInEth",
      args: [...prepareSwapRouterPathArgs(fromCurrencyAddress, auctionParams, false), deadline],
      value: amountIn
    })
  } else {
    if (!permit || !permitSignature)
      throw new Error("Permit2 data and signature required for token swap")

    // Execute swap with token
    return await client.writeContract({
      address: ratRouterAddress,
      abi: RatRouterAbi,
      functionName: "swapExactInToken",
      args: [
        amountIn,
        ...prepareSwapRouterPathArgs(fromCurrencyAddress, auctionParams, false),
        permit,
        permitSignature
      ]
    })
  }
}
