import { get } from "svelte/store"
import { erc20Abi, Hex } from "viem"
import type { PublicClient } from "drawbridge"
import { publicClient as publicClientStore, networkConfig } from "$lib/network"
import { userAddress } from "$lib/modules/drawbridge"
import { playerERC20Balance, erc20BalanceListenerActive } from "$lib/modules/erc20Listener/stores"

let balanceInterval: NodeJS.Timeout | null = null
const BALANCE_INTERVAL = 10_000 // 10 seconds

/**
 * Manually refetch the ERC20 balance
 */
export async function refetchBalance() {
  const currentPublicClient = get(publicClientStore)
  const currentPlayerAddress = get(userAddress) as Hex | null
  const config = get(networkConfig)

  if (!currentPublicClient || !currentPlayerAddress || !config) {
    return
  }

  await updateBalance(currentPublicClient, currentPlayerAddress, config.ratTokenAddress)
}

/**
 * Update the ERC20 balance
 */
async function updateBalance(publicClient: PublicClient, playerAddr: Hex, erc20Address: Hex) {
  try {
    const balance = await readPlayerERC20Balance(publicClient, playerAddr, erc20Address)
    if (balance !== get(playerERC20Balance)) {
      playerERC20Balance.set(balance)
    }
  } catch (error) {
    console.error("Failed to update ERC20 balance:", error)
  }
}

/**
 * Initialize the ERC20 listener
 */
export function initErc20Listener() {
  // Clear old intervals (on network change, wallet change, etc...)
  stopErc20Listener()

  const currentPublicClient = get(publicClientStore)
  const currentPlayerAddress = get(userAddress) as Hex | null
  const config = get(networkConfig)

  if (!currentPublicClient || !currentPlayerAddress || !config) {
    return
  }

  const erc20Address = config.ratTokenAddress

  // Initial fetch and set up balance interval
  updateBalance(currentPublicClient, currentPlayerAddress, erc20Address)

  // Balance is updated explicitly after user actions, we just have this to listen for external changes
  balanceInterval = setInterval(() => {
    // For certain parts of the gameplay we want to pause automatic balance updates
    // to be able to manually update with specific timing
    if (!get(erc20BalanceListenerActive)) {
      return
    }

    const pubClient = get(publicClientStore)
    const playerAddr = get(userAddress) as Hex | null
    const cfg = get(networkConfig)

    if (pubClient && playerAddr && cfg) {
      updateBalance(pubClient, playerAddr, cfg.ratTokenAddress)
    }
  }, BALANCE_INTERVAL)
}

/**
 * Clear all ERC20 listener intervals
 */
export function stopErc20Listener() {
  if (balanceInterval) {
    clearInterval(balanceInterval)
    balanceInterval = null
  }
}

/**
 * Read the player's ERC20 balance
 */
export async function readPlayerERC20Balance(
  publicClient: PublicClient,
  playerAddress: Hex,
  erc20Address: Hex
) {
  const balance = await publicClient.readContract({
    address: erc20Address,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: [playerAddress]
  })

  return Number(balance / 10n ** 18n)
}
