import type { AuctionParams } from "doppler"
import { getPoolKey } from "doppler"
import { encodePacked, Hex } from "viem"

export interface CurrencyData {
  address: Hex
  decimals: number
  symbol: string
  isNative?: boolean // true for native ETH (not WETH)
}

// Mainnet-only addresses
export const ratRouterAddress: Hex = "0x0dAC1415e9DB2917E4Db14b27961378b7DDfD19B"

export const eurcCurrency: CurrencyData = {
  address: "0x60a3e35cc302bfa44cb288bc5a4f316fdb1adb42",
  decimals: 6,
  symbol: "EURC"
}

export const usdcCurrency: CurrencyData = {
  address: "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913",
  decimals: 6,
  symbol: "USDC"
}

export const wethCurrency: CurrencyData = {
  address: "0x4200000000000000000000000000000000000006",
  decimals: 18,
  symbol: "ETH",
  isNative: true // ETH is native, we use WETH address for swaps but fetch native balance
}
// Available currencies for swap (user can select from these)
export const availableCurrencies: CurrencyData[] = [wethCurrency, usdcCurrency]

/**
 * Derive the token currency from auction params
 */
export function getTokenCurrency(auctionParams: AuctionParams): CurrencyData {
  return {
    address: auctionParams.token.address,
    decimals: auctionParams.token.decimals,
    symbol: auctionParams.token.symbol
  }
}

const aerodromePaths: Record<Hex, [number, Hex][]> = {
  [usdcCurrency.address]: [[50, eurcCurrency.address]],
  [wethCurrency.address]: [[100, eurcCurrency.address]]
}

function getAerodromePath(fromCurrencyAddress: Hex, isExactOut: boolean): Hex {
  if (!(fromCurrencyAddress in aerodromePaths)) {
    throw new Error("Invalid start address")
  }
  const unpackedPath = aerodromePaths[fromCurrencyAddress]
  const unpackedPathAbiTypes = Array(unpackedPath.length).fill(["int24", "address"])

  let fullPath = [fromCurrencyAddress, ...unpackedPath.flat()]
  let fullPathAbiTypes = ["address", ...unpackedPathAbiTypes.flat()]
  if (isExactOut) {
    fullPath = fullPath.reverse()
    fullPathAbiTypes = fullPathAbiTypes.reverse()
  }

  const packedPath = encodePacked(fullPathAbiTypes, fullPath)
  return packedPath
}

export function prepareSwapRouterPathArgs(
  fromCurrencyAddress: Hex,
  auctionParams: AuctionParams,
  isExactOut: boolean
) {
  const aerodromePath = getAerodromePath(fromCurrencyAddress, isExactOut)

  const poolKey = getPoolKey(auctionParams)
  const zeroForOne = !auctionParams.isToken0

  return [aerodromePath, poolKey, zeroForOne] as const
}

export function isPermit2Required(fromCurrencyAddress: Hex): boolean {
  // Permit2 is required for everything except eth
  return fromCurrencyAddress.toLowerCase() !== wethCurrency.address.toLowerCase()
}
