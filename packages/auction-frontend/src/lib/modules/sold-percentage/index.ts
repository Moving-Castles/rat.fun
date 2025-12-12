import { type AuctionParams } from "doppler"
import { dopplerHookAbi } from "@whetstone-research/doppler-sdk"
import type { PublicClient } from "viem"

/**
 * Calculate the percentage of proceeds raised relative to maximum proceeds.
 *
 * Formula: soldPercentage = totalProceeds / maximumProceeds * 100
 *
 * @param publicClient - Viem public client
 * @param auctionParams - Auction parameters containing hook address
 * @returns Sold percentage (0-100) or null if calculation fails
 */
export async function getSoldPercentage(
  publicClient: PublicClient,
  auctionParams: AuctionParams
): Promise<number | null> {
  try {
    // Get maximumProceeds from hook
    const maximumProceeds = await publicClient.readContract({
      address: auctionParams.hookAddress,
      abi: dopplerHookAbi,
      functionName: "maximumProceeds"
    })

    if (maximumProceeds === 0n) {
      console.warn("[SoldPercentage] maximumProceeds is 0")
      return null
    }

    // Get totalProceeds from hook state
    const hookState = await publicClient.readContract({
      address: auctionParams.hookAddress,
      abi: dopplerHookAbi,
      functionName: "state"
    })
    const totalProceeds = hookState[3] // totalProceeds is at index 3

    // Calculate percentage: totalProceeds / maximumProceeds * 100
    const soldPercentage = Number((totalProceeds * 10000n) / maximumProceeds) / 100

    console.log("[SoldPercentage] Calculation:", {
      totalProceeds: totalProceeds.toString(),
      maximumProceeds: maximumProceeds.toString(),
      soldPercentage
    })

    return soldPercentage
  } catch (error) {
    console.error("[SoldPercentage] Failed to calculate sold percentage:", error)
    return null
  }
}
