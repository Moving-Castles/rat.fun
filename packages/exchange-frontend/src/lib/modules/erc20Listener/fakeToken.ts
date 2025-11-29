import { Hex } from "viem"
import { get } from "svelte/store"
import { publicClient as publicClientStore } from "$lib/network"
import { userAddress } from "$lib/modules/drawbridge"
import { readPlayerERC20Allowance, readPlayerERC20Balance } from "$lib/modules/erc20Listener"
import { playerFakeTokenAllowance, playerFakeTokenBalance } from "$lib/modules/erc20Listener/stores"
import {
  fakeTokenErc20Address,
  fakeTokenExchangeAddress
} from "$lib/modules/on-chain-transactions/fakeToken"

let fakeBalanceInterval: NodeJS.Timeout | null = null
const FAKE_BALANCE_INTERVAL = 10_000 // 10 seconds
let fakeAllowanceInterval: NodeJS.Timeout | null = null
const FAKE_ALLOWANCE_INTERVAL = 60_000 // 1 minute

export async function refetchFakeTokenAllowance() {
  const pubClient = get(publicClientStore)
  const playerAddr = get(userAddress) as Hex | null

  if (!pubClient || !playerAddr) return

  const allowance = await readPlayerERC20Allowance(
    pubClient,
    playerAddr,
    fakeTokenExchangeAddress,
    fakeTokenErc20Address
  )
  playerFakeTokenAllowance.set(allowance)
}

export async function refetchFakeTokenBalance() {
  const pubClient = get(publicClientStore)
  const playerAddr = get(userAddress) as Hex | null

  if (!pubClient || !playerAddr) return

  const balance = await readPlayerERC20Balance(pubClient, playerAddr, fakeTokenErc20Address)
  playerFakeTokenBalance.set(balance)
}

/**
 * Initialize the fake token listener with automatic polling
 */
export function initFakeTokenListener() {
  // Clear old intervals
  stopFakeTokenListener()

  const currentPublicClient = get(publicClientStore)
  const currentPlayerAddress = get(userAddress) as Hex | null

  if (!currentPublicClient || !currentPlayerAddress) {
    return
  }

  // Initial fetch and set up balance interval
  refetchFakeTokenBalance()
  fakeBalanceInterval = setInterval(() => {
    refetchFakeTokenBalance()
  }, FAKE_BALANCE_INTERVAL)

  // Initial fetch and set up allowance interval
  refetchFakeTokenAllowance()
  fakeAllowanceInterval = setInterval(() => {
    refetchFakeTokenAllowance()
  }, FAKE_ALLOWANCE_INTERVAL)
}

/**
 * Stop all fake token listener intervals
 */
export function stopFakeTokenListener() {
  if (fakeBalanceInterval) {
    clearInterval(fakeBalanceInterval)
    fakeBalanceInterval = null
  }
  if (fakeAllowanceInterval) {
    clearInterval(fakeAllowanceInterval)
    fakeAllowanceInterval = null
  }
}
