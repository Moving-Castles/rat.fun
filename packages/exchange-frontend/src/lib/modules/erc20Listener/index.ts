import { get } from "svelte/store"
import { erc20Abi, Hex } from "viem"
import type { PublicClient } from "drawbridge"
import {
  publicClient as publicClientStore,
  externalAddresses,
  type ExternalAddresses
} from "$lib/network"
import { userAddress } from "$lib/modules/drawbridge"
import { playerERC20Allowance, playerERC20Balance } from "$lib/modules/erc20Listener/stores"
import { erc20BalanceListenerActive } from "$lib/modules/erc20Listener/stores"

let balanceInterval: NodeJS.Timeout | null = null
const BALANCE_INTERVAL = 10_000 // 10 seconds
let allowanceInterval: NodeJS.Timeout | null = null
const ALLOWANCE_INTERVAL = 60_000 // 1 minute

/**
 * Manually refetch the ERC20 allowance
 */
export async function refetchAllowance() {
  const currentPublicClient = get(publicClientStore)
  const currentPlayerAddress = get(userAddress) as Hex | null
  const currentExternalAddresses = get(externalAddresses)

  if (!currentPublicClient || !currentPlayerAddress || !currentExternalAddresses) {
    return
  }

  await updateAllowance(currentPublicClient, currentPlayerAddress, currentExternalAddresses)
}

/**
 * Manually refetch the ERC20 balance
 */
export async function refetchBalance() {
  const currentPublicClient = get(publicClientStore)
  const currentPlayerAddress = get(userAddress) as Hex | null
  const currentExternalAddresses = get(externalAddresses)

  if (!currentPublicClient || !currentPlayerAddress || !currentExternalAddresses) {
    return
  }

  await updateBalance(
    currentPublicClient,
    currentPlayerAddress,
    currentExternalAddresses.erc20Address
  )
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
 * Update the ERC20 allowance
 */
async function updateAllowance(
  publicClient: PublicClient,
  playerAddr: Hex,
  addresses: ExternalAddresses
) {
  try {
    const allowance = await readPlayerERC20Allowance(
      publicClient,
      playerAddr,
      addresses.gamePoolAddress,
      addresses.erc20Address
    )
    playerERC20Allowance.set(allowance)
  } catch (error) {
    console.error("Failed to update ERC20 allowance:", error)
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
  const currentExternalAddresses = get(externalAddresses)

  if (!currentPublicClient || !currentPlayerAddress || !currentExternalAddresses) {
    return
  }

  const erc20Address = currentExternalAddresses.erc20Address

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
    const addresses = get(externalAddresses)

    if (pubClient && playerAddr && addresses) {
      updateBalance(pubClient, playerAddr, addresses.erc20Address)
    }
  }, BALANCE_INTERVAL)

  // Initial fetch and set up allowance interval
  updateAllowance(currentPublicClient, currentPlayerAddress, currentExternalAddresses)
  // Allowance is updated explicitly after user actions, we just have this to listen for external changes
  allowanceInterval = setInterval(() => {
    const pubClient = get(publicClientStore)
    const playerAddr = get(userAddress) as Hex | null
    const addresses = get(externalAddresses)

    if (pubClient && playerAddr && addresses) {
      updateAllowance(pubClient, playerAddr, addresses)
    }
  }, ALLOWANCE_INTERVAL)
}

/**
 * Clear all ERC20 listener intervals
 */
export function stopErc20Listener() {
  if (balanceInterval) {
    clearInterval(balanceInterval)
    balanceInterval = null
  }
  if (allowanceInterval) {
    clearInterval(allowanceInterval)
    allowanceInterval = null
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

/**
 * Read the player's ERC20 allowance
 */
export async function readPlayerERC20Allowance(
  publicClient: PublicClient,
  playerAddress: Hex,
  spenderAddress: Hex,
  erc20Address: Hex
) {
  const allowance = await publicClient.readContract({
    address: erc20Address,
    abi: erc20Abi,
    functionName: "allowance",
    args: [playerAddress, spenderAddress]
  })

  return Number(allowance / 10n ** 18n)
}
