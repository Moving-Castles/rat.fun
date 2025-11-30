import { get } from "svelte/store"
import { erc20Abi, formatUnits, type Hex } from "viem"
import type { PublicClient } from "drawbridge"
import { publicClient as publicClientStore } from "$lib/network"
import { userAddress } from "$lib/modules/drawbridge"
import { trackedCurrencies, type CurrencyData } from "$lib/modules/swap-router"
import { tokenBalances, balanceListenerActive, type TokenBalance } from "./stores"

export * from "./stores"

let balanceInterval: NodeJS.Timeout | null = null
const BALANCE_INTERVAL = 10_000 // 10 seconds

/**
 * Fetch balance for a single currency
 */
async function fetchBalance(
  client: PublicClient,
  playerAddress: Hex,
  currency: CurrencyData
): Promise<TokenBalance> {
  let balance: bigint

  if (currency.isNative) {
    // Native ETH balance
    balance = await client.getBalance({ address: playerAddress })
  } else {
    // ERC20 balance
    balance = await client.readContract({
      address: currency.address,
      abi: erc20Abi,
      functionName: "balanceOf",
      args: [playerAddress]
    })
  }

  return {
    address: currency.address,
    symbol: currency.symbol,
    balance,
    decimals: currency.decimals,
    formatted: Number(formatUnits(balance, currency.decimals))
  }
}

/**
 * Update all tracked token balances
 */
async function updateAllBalances(client: PublicClient, playerAddress: Hex) {
  const newBalances: Record<Hex, TokenBalance> = {}

  await Promise.all(
    trackedCurrencies.map(async currency => {
      try {
        const balance = await fetchBalance(client, playerAddress, currency)
        newBalances[currency.address] = balance
      } catch (error) {
        console.error(`[Balances] Failed to fetch ${currency.symbol} balance:`, error)
      }
    })
  )

  tokenBalances.set(newBalances)
}

/**
 * Manually refetch all balances
 */
export async function refetchBalances() {
  const client = get(publicClientStore)
  const currentUserAddress = get(userAddress) as Hex | null

  if (!client || !currentUserAddress) {
    return
  }

  await updateAllBalances(client, currentUserAddress)
}

/**
 * Initialize the balance listener for all tracked currencies
 */
export function initBalanceListener() {
  // Clear old intervals
  stopBalanceListener()

  const client = get(publicClientStore)
  const currentUserAddress = get(userAddress) as Hex | null

  if (!client || !currentUserAddress) {
    console.log("[Balances] Cannot init - missing client or address")
    return
  }

  // Initial fetch
  updateAllBalances(client, currentUserAddress)

  // Set up polling interval
  balanceInterval = setInterval(() => {
    if (!get(balanceListenerActive)) {
      return
    }

    const addr = get(userAddress) as Hex | null
    if (client && addr) {
      updateAllBalances(client, addr)
    }
  }, BALANCE_INTERVAL)

  console.log("[Balances] Initialized for", currentUserAddress)
}

/**
 * Stop the balance listener
 */
export function stopBalanceListener() {
  if (balanceInterval) {
    clearInterval(balanceInterval)
    balanceInterval = null
  }
}

/**
 * Get balance for a specific currency address
 */
export function getBalance(address: Hex): TokenBalance | undefined {
  return get(tokenBalances)[address]
}

/**
 * Get formatted balance for a specific currency address
 */
export function getFormattedBalance(address: Hex): number | undefined {
  return get(tokenBalances)[address]?.formatted
}
