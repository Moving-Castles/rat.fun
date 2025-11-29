import { get } from "svelte/store"
import { erc20Abi, type Hex } from "viem"
import type { PublicClient } from "drawbridge"
import { publicClient as publicClientStore, networkConfig } from "$lib/network"
import { userAddress } from "$lib/modules/drawbridge"
import { playerERC20Balance, erc20BalanceListenerActive } from "./stores"

let balanceInterval: NodeJS.Timeout | null = null
const BALANCE_INTERVAL = 10_000 // 10 seconds

/**
 * Manually refetch the ERC20 balance
 */
export async function refetchBalance() {
  const client = get(publicClientStore)
  const currentUserAddress = get(userAddress) as Hex | null
  const config = get(networkConfig)

  if (!client || !currentUserAddress || !config) {
    return
  }

  await updateBalance(client, currentUserAddress, config.ratTokenAddress)
}

/**
 * Update the ERC20 balance
 */
async function updateBalance(client: PublicClient, playerAddr: Hex, erc20Address: Hex) {
  try {
    const balance = await readPlayerERC20Balance(client, playerAddr, erc20Address)
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

  const client = get(publicClientStore)
  const currentUserAddress = get(userAddress) as Hex | null
  const config = get(networkConfig)

  if (!client || !currentUserAddress || !config) {
    console.log("[ERC20Listener] Cannot init - missing client, address, or config")
    return
  }

  const ratTokenAddress = config.ratTokenAddress

  // Initial fetch and set up balance interval
  updateBalance(client, currentUserAddress, ratTokenAddress)
  balanceInterval = setInterval(() => {
    // For certain parts of the gameplay we want to pause automatic balance updates
    if (!get(erc20BalanceListenerActive)) {
      return
    }

    const addr = get(userAddress) as Hex | null
    if (client && addr && ratTokenAddress) {
      updateBalance(client, addr, ratTokenAddress)
    }
  }, BALANCE_INTERVAL)

  console.log("[ERC20Listener] Initialized for", currentUserAddress)
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
  client: PublicClient,
  playerAddress: Hex,
  erc20Address: Hex
) {
  const balance = await client.readContract({
    address: erc20Address,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: [playerAddress]
  })

  return Number(balance / 10n ** 18n)
}
