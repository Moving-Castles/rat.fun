/**
 * Fallback estimation module for when the quoter contract fails.
 *
 * TEMPORARY WORKAROUND: This module exists because the RatQuoter contract
 * doesn't pass buyer address in hookData, causing NoCountryCode errors.
 * Remove this module once the contract is fixed.
 *
 * To disable: set ENABLE_FALLBACK_ESTIMATE to false
 */

import { formatUnits, parseUnits } from "viem"
import { wethCurrency } from "./currency"

// Toggle to easily disable fallback estimation
export const ENABLE_FALLBACK_ESTIMATE = true

interface EstimateParams {
  amountIn: bigint
  fromCurrencyAddress: string
  fromCurrencyDecimals: number
  tokenDecimals: number
  currentPriceUsdc: number | undefined
  eurcToEthRate: number | undefined
  eurcToUsdcRate: number | undefined
}

export interface FallbackEstimateResult {
  amountOut: bigint
  isEstimate: true
}

/**
 * Calculate fallback estimate when quoter fails.
 * Uses stored currentPriceUsdc and exchange rates.
 *
 * @returns Estimated RAT output as bigint, or undefined if estimation not possible
 */
export function calculateFallbackEstimate(
  params: EstimateParams
): FallbackEstimateResult | undefined {
  if (!ENABLE_FALLBACK_ESTIMATE) {
    return undefined
  }

  const {
    amountIn,
    fromCurrencyAddress,
    fromCurrencyDecimals,
    tokenDecimals,
    currentPriceUsdc,
    eurcToEthRate,
    eurcToUsdcRate
  } = params

  if (!currentPriceUsdc || currentPriceUsdc <= 0) {
    return undefined
  }

  // Convert amountIn to USDC equivalent
  let amountInUsdc: number
  const amountInNumber = Number(formatUnits(amountIn, fromCurrencyDecimals))

  const isEth = fromCurrencyAddress.toLowerCase() === wethCurrency.address.toLowerCase()

  if (isEth) {
    // ETH -> need eurcToEthRate to convert
    // eurcToEthRate = how much ETH per 1 EURC
    // eurcToUsdcRate = how much USDC per 1 EURC
    // So: ETH -> EURC -> USDC
    if (!eurcToEthRate || !eurcToUsdcRate || eurcToEthRate <= 0) {
      return undefined
    }
    // amountIn ETH * (1 EURC / eurcToEthRate ETH) * (eurcToUsdcRate USDC / 1 EURC) = USDC
    amountInUsdc = (amountInNumber / eurcToEthRate) * eurcToUsdcRate
  } else {
    // USDC - direct
    amountInUsdc = amountInNumber
  }

  // Calculate RAT output: amountInUsdc / pricePerRat
  const estimatedRat = amountInUsdc / currentPriceUsdc

  if (estimatedRat <= 0 || !Number.isFinite(estimatedRat)) {
    return undefined
  }

  // Apply 5% discount to be conservative (user gets at least this much)
  const conservativeEstimate = estimatedRat * 0.95

  try {
    const estimatedRatBigint = parseUnits(
      conservativeEstimate.toFixed(tokenDecimals),
      tokenDecimals
    )

    return {
      amountOut: estimatedRatBigint,
      isEstimate: true
    }
  } catch {
    return undefined
  }
}
