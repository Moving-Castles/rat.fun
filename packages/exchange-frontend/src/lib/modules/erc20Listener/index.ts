import { get } from "svelte/store"
import { erc20Abi, type Hex } from "viem"
import type { PublicClient } from "drawbridge"
import { publicClient as publicClientStore } from "$lib/network"
import {
  fakeRatTokenAddress,
  ratTokenAddress,
  exchangeContractAddress
} from "$lib/modules/on-chain-transactions/fakeToken"
import { userAddress } from "$lib/modules/drawbridge"
import {
  balanceListenerActive,
  ratTokenBalance,
  fakeRatTokenBalance,
  fakeRatTokenAllowance,
  exchangeRatBalance
} from "$lib/modules/erc20Listener/stores"

let balanceInterval: NodeJS.Timeout | null = null
const BALANCE_INTERVAL = 10_000 // 10 seconds

let allowanceInterval: NodeJS.Timeout | null = null
const ALLOWANCE_INTERVAL = 60_000 // 1 minute

/**
 * Manually refetch both token balances
 */
export async function refetchBalances() {
  const pubClient = get(publicClientStore)
  const playerAddr = get(userAddress) as Hex | null

  if (!pubClient || !playerAddr) return

  await Promise.all([
    updateRatBalance(pubClient, playerAddr),
    updateFakeRatBalance(pubClient, playerAddr)
  ])
}

/**
 * Manually refetch RAT token balance
 */
export async function refetchRatBalance() {
  const pubClient = get(publicClientStore)
  const playerAddr = get(userAddress) as Hex | null

  if (!pubClient || !playerAddr) return

  await updateRatBalance(pubClient, playerAddr)
}

/**
 * Manually refetch FakeRAT token balance
 */
export async function refetchFakeRatBalance() {
  const pubClient = get(publicClientStore)
  const playerAddr = get(userAddress) as Hex | null

  if (!pubClient || !playerAddr) return

  await updateFakeRatBalance(pubClient, playerAddr)
}

/**
 * Manually refetch FakeRAT allowance for exchange contract
 */
export async function refetchFakeRatAllowance() {
  const pubClient = get(publicClientStore)
  const playerAddr = get(userAddress) as Hex | null

  if (!pubClient || !playerAddr) return

  await updateFakeRatAllowance(pubClient, playerAddr)
}

/**
 * Update RAT token balance
 */
async function updateRatBalance(publicClient: PublicClient, playerAddr: Hex) {
  try {
    const balance = await readBalance(publicClient, playerAddr, ratTokenAddress)
    if (balance !== get(ratTokenBalance)) {
      ratTokenBalance.set(balance)
    }
  } catch (error) {
    console.error("Failed to update RAT balance:", error)
  }
}

/**
 * Update FakeRAT token balance
 */
async function updateFakeRatBalance(publicClient: PublicClient, playerAddr: Hex) {
  try {
    const balance = await readBalance(publicClient, playerAddr, fakeRatTokenAddress)
    if (balance !== get(fakeRatTokenBalance)) {
      fakeRatTokenBalance.set(balance)
    }
  } catch (error) {
    console.error("Failed to update FakeRAT balance:", error)
  }
}

/**
 * Update FakeRAT allowance for exchange contract
 */
async function updateFakeRatAllowance(publicClient: PublicClient, playerAddr: Hex) {
  try {
    const allowance = await readAllowance(
      publicClient,
      playerAddr,
      exchangeContractAddress,
      fakeRatTokenAddress
    )
    if (allowance !== get(fakeRatTokenAllowance)) {
      fakeRatTokenAllowance.set(allowance)
    }
  } catch (error) {
    console.error("Failed to update FakeRAT allowance:", error)
  }
}

/**
 * Update RAT balance held by the exchange contract
 */
async function updateExchangeRatBalance(publicClient: PublicClient) {
  try {
    const balance = await readBalance(publicClient, exchangeContractAddress, ratTokenAddress)
    if (balance !== get(exchangeRatBalance)) {
      exchangeRatBalance.set(balance)
    }
  } catch (error) {
    console.error("Failed to update exchange RAT balance:", error)
  }
}

/**
 * Initialize the token listener for both RAT and FakeRAT
 */
export function initTokenListener() {
  // Clear old intervals
  stopTokenListener()

  const currentPublicClient = get(publicClientStore)
  const currentPlayerAddress = get(userAddress) as Hex | null

  if (!currentPublicClient || !currentPlayerAddress) {
    return
  }

  // Initial fetch for all values
  updateRatBalance(currentPublicClient, currentPlayerAddress)
  updateFakeRatBalance(currentPublicClient, currentPlayerAddress)
  updateFakeRatAllowance(currentPublicClient, currentPlayerAddress)
  updateExchangeRatBalance(currentPublicClient)

  // Set up balance polling interval
  balanceInterval = setInterval(() => {
    if (!get(balanceListenerActive)) {
      return
    }

    const pubClient = get(publicClientStore)
    const playerAddr = get(userAddress) as Hex | null

    if (pubClient && playerAddr) {
      updateRatBalance(pubClient, playerAddr)
      updateFakeRatBalance(pubClient, playerAddr)
      updateExchangeRatBalance(pubClient)
    }
  }, BALANCE_INTERVAL)

  // Set up allowance polling interval (less frequent)
  allowanceInterval = setInterval(() => {
    const pubClient = get(publicClientStore)
    const playerAddr = get(userAddress) as Hex | null

    if (pubClient && playerAddr) {
      updateFakeRatAllowance(pubClient, playerAddr)
    }
  }, ALLOWANCE_INTERVAL)
}

/**
 * Stop all token listener intervals
 */
export function stopTokenListener() {
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
 * Read token balance
 */
async function readBalance(
  publicClient: PublicClient,
  playerAddress: Hex,
  tokenAddress: Hex
): Promise<number> {
  const balance = await publicClient.readContract({
    address: tokenAddress,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: [playerAddress]
  })

  return Number(balance / 10n ** 18n)
}

/**
 * Read token allowance
 */
async function readAllowance(
  publicClient: PublicClient,
  playerAddress: Hex,
  spenderAddress: Hex,
  tokenAddress: Hex
): Promise<number> {
  const allowance = await publicClient.readContract({
    address: tokenAddress,
    abi: erc20Abi,
    functionName: "allowance",
    args: [playerAddress, spenderAddress]
  })

  return Number(allowance / 10n ** 18n)
}
