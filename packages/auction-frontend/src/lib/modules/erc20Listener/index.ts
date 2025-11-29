import { get } from "svelte/store"
import { erc20Abi, type Hex } from "viem"
import type { PublicClient } from "drawbridge"
import {
  publicClient as publicClientStore,
  externalAddresses,
  type ExternalAddresses
} from "$lib/network"
import { userAddress } from "$lib/modules/drawbridge"
import { playerERC20Allowance, playerERC20Balance, erc20BalanceListenerActive } from "./stores"

let balanceInterval: NodeJS.Timeout | null = null
const BALANCE_INTERVAL = 10_000 // 10 seconds
let allowanceInterval: NodeJS.Timeout | null = null
const ALLOWANCE_INTERVAL = 60_000 // 1 minute

/**
 * Manually refetch the ERC20 allowance
 */
export async function refetchAllowance() {
  const client = get(publicClientStore)
  const currentUserAddress = get(userAddress) as Hex | null
  const currentExternalAddresses = get(externalAddresses)

  if (!client || !currentUserAddress || !currentExternalAddresses) {
    return
  }

  await updateAllowance(client, currentUserAddress, currentExternalAddresses)
}

/**
 * Manually refetch the ERC20 balance
 */
export async function refetchBalance() {
  const client = get(publicClientStore)
  const currentUserAddress = get(userAddress) as Hex | null
  const currentExternalAddresses = get(externalAddresses)

  if (!client || !currentUserAddress || !currentExternalAddresses) {
    return
  }

  await updateBalance(client, currentUserAddress, currentExternalAddresses.erc20Address)
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
 * Update the ERC20 allowance
 */
async function updateAllowance(
  client: PublicClient,
  playerAddr: Hex,
  addresses: ExternalAddresses
) {
  try {
    const allowance = await readPlayerERC20Allowance(
      client,
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

  const client = get(publicClientStore)
  const currentUserAddress = get(userAddress) as Hex | null
  const currentExternalAddresses = get(externalAddresses)

  if (!client || !currentUserAddress || !currentExternalAddresses) {
    console.log("[ERC20Listener] Cannot init - missing client, address, or external addresses")
    return
  }

  const erc20Address = currentExternalAddresses.erc20Address

  // Initial fetch and set up balance interval
  updateBalance(client, currentUserAddress, erc20Address)
  balanceInterval = setInterval(() => {
    // For certain parts of the gameplay we want to pause automatic balance updates
    if (!get(erc20BalanceListenerActive)) {
      return
    }

    const addr = get(userAddress) as Hex | null
    if (client && addr && erc20Address) {
      updateBalance(client, addr, erc20Address)
    }
  }, BALANCE_INTERVAL)

  // Initial fetch and set up allowance interval
  updateAllowance(client, currentUserAddress, currentExternalAddresses)
  allowanceInterval = setInterval(() => {
    const addr = get(userAddress) as Hex | null
    const addresses = get(externalAddresses)
    if (client && addr && addresses) {
      updateAllowance(client, addr, addresses)
    }
  }, ALLOWANCE_INTERVAL)

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
  if (allowanceInterval) {
    clearInterval(allowanceInterval)
    allowanceInterval = null
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

/**
 * Read the player's ERC20 allowance
 */
export async function readPlayerERC20Allowance(
  client: PublicClient,
  playerAddress: Hex,
  spenderAddress: Hex,
  erc20Address: Hex
) {
  const allowance = await client.readContract({
    address: erc20Address,
    abi: erc20Abi,
    functionName: "allowance",
    args: [playerAddress, spenderAddress]
  })

  return Number(allowance / 10n ** 18n)
}
