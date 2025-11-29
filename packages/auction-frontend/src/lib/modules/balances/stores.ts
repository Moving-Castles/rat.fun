import { writable } from "svelte/store"
import type { Hex } from "viem"

/**
 * Token balance with metadata
 */
export interface TokenBalance {
  address: Hex
  symbol: string
  balance: bigint
  decimals: number
  formatted: number
}

/**
 * Map of token address -> balance data
 */
export const tokenBalances = writable<Record<Hex, TokenBalance>>({})

/**
 * Flag to pause/resume balance updates
 */
export const balanceListenerActive = writable(true)
