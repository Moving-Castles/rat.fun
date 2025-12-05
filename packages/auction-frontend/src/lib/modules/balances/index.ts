import { ERC20BalanceListener, ETHBalanceListener } from "@ratfun/common/erc20"
import { PublicClient } from "drawbridge"
import { derived, get, Unsubscriber, writable } from "svelte/store"
import { formatUnits, Hex } from "viem"
import { availableCurrencies, CurrencyData, wethCurrency } from "../swap-router"

/**
 * Token balance with metadata
 */
export interface TokenBalance {
  balance: bigint
  formatted: number
}

interface CurrencyListener {
  listener: ERC20BalanceListener | ETHBalanceListener
  currency: CurrencyData
}

export const balanceListeners = writable<CurrencyListener[]>([])

/**
 * Initialize the balance listeners for token currency and all available currencies
 */
export function initBalanceListeners(
  publicClient: PublicClient,
  userAddress: Hex,
  tokenCurrency: CurrencyData
) {
  // Stop old listeners
  for (const { listener } of get(balanceListeners)) {
    listener.stop()
  }

  publicClient.getBalance({ address: userAddress })

  // Create listeners for tokenCurrency and all availableCurrencies
  const newBalanceListeners: CurrencyListener[] = []
  for (const currency of [tokenCurrency, ...availableCurrencies]) {
    const balanceListener = {
      // ETH has a different listener class
      listener:
        currency.address === wethCurrency.address
          ? new ETHBalanceListener(publicClient, userAddress)
          : new ERC20BalanceListener(publicClient, userAddress, currency.address),
      currency
    }
    // Start each one
    balanceListener.listener.start()
    newBalanceListeners.push(balanceListener)
  }
  // Update store
  balanceListeners.set(newBalanceListeners)
}

/**
 * Balances of all tracked currencies
 */
export const tokenBalances = derived<typeof balanceListeners, Record<Hex, TokenBalance>>(
  balanceListeners,
  ($listeners, _, update) => {
    const unsubscribers: Unsubscriber[] = []
    // listen for erc20 balance updates
    for (const { listener, currency } of $listeners) {
      unsubscribers.push(
        listener.subscribe(balance => {
          update(balances => {
            balances[currency.address] = {
              balance,
              formatted: Number(formatUnits(balance, currency.decimals))
            }
            return balances
          })
        })
      )
    }
    return () => {
      unsubscribers.forEach(unsubscribe => unsubscribe())
    }
  },
  {}
)
