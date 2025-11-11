import { get } from "svelte/store"
import { erc20Abi, Hex } from "viem"
import { SetupPublicNetworkResult } from "$lib/mud/setupPublicNetwork"
import { publicNetwork } from "$lib/modules/network"
import { externalAddressesConfig, playerAddress } from "$lib/modules/state/stores"
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
  const currentNetwork = get(publicNetwork) as SetupPublicNetworkResult
  const currentPlayerAddress = get(playerAddress) as Hex
  const currentExternalAddresses = get(externalAddressesConfig)

  if (!currentNetwork || !currentPlayerAddress || !currentExternalAddresses) {
    return
  }

  await updateAllowance(currentNetwork, currentPlayerAddress, currentExternalAddresses)
}

/**
 * Manually refetch the ERC20 balance
 */
export async function refetchBalance() {
  const currentNetwork = get(publicNetwork) as SetupPublicNetworkResult
  const currentPlayerAddress = get(playerAddress) as Hex
  const currentExternalAddresses = get(externalAddressesConfig)

  if (!currentNetwork || !currentPlayerAddress || !currentExternalAddresses) {
    return
  }

  await updateBalance(currentNetwork, currentPlayerAddress, currentExternalAddresses.erc20Address)
}

/**
 * Update the ERC20 balance
 * @param network - The network to update the balance on
 * @param playerAddr - The address of the player to update the balance for
 * @param erc20Address - The address of the ERC20 token to update the balance for
 */
async function updateBalance(
  network: SetupPublicNetworkResult,
  playerAddr: Hex,
  erc20Address: Hex
) {
  try {
    const balance = await readPlayerERC20Balance(network, playerAddr, erc20Address)
    if (balance !== get(playerERC20Balance)) {
      playerERC20Balance.set(balance)
    }
  } catch (error) {
    console.error("Failed to update ERC20 balance:", error)
  }
}

/**
 * Update the ERC20 allowance
 * @param network - The network to update the allowance on
 * @param playerAddr - The address of the player to update the allowance for
 * @param externalAddresses - The external addresses to update the allowance for
 */
async function updateAllowance(
  network: SetupPublicNetworkResult,
  playerAddr: Hex,
  externalAddresses: ExternalAddressesConfigObject
) {
  try {
    const allowance = await readPlayerERC20Allowance(
      network,
      playerAddr,
      externalAddresses.gamePoolAddress,
      externalAddresses.erc20Address
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

  const currentNetwork = get(publicNetwork) as SetupPublicNetworkResult
  const currentPlayerAddress = get(playerAddress) as Hex
  const currentExternalAddresses = get(externalAddressesConfig)

  if (!currentNetwork || !currentPlayerAddress || !currentExternalAddresses) {
    return
  }

  const erc20Address = currentExternalAddresses.erc20Address

  // Initial fetch and set up balance interval
  updateBalance(currentNetwork, currentPlayerAddress, erc20Address)
  // Balance is updated explicitly after user actions, we just have this to listen for external changes
  balanceInterval = setInterval(() => {
    // For certain parts of the gameplay we want to pause automatic balance updates
    // to be able to manually update with specific timing
    if (!get(erc20BalanceListenerActive)) {
      return
    }

    if (currentNetwork && currentPlayerAddress && erc20Address) {
      updateBalance(currentNetwork, currentPlayerAddress, erc20Address)
    }
  }, BALANCE_INTERVAL)

  // Initial fetch and set up allowance interval
  updateAllowance(currentNetwork, currentPlayerAddress, currentExternalAddresses)
  // Allowance is updated explicitly after user actions, we just have this to listen for external changes
  allowanceInterval = setInterval(() => {
    if (currentNetwork && currentPlayerAddress && currentExternalAddresses) {
      updateAllowance(currentNetwork, currentPlayerAddress, currentExternalAddresses)
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
 * @param publicNetwork - The public network to read the balance from
 * @param playerAddress - The address of the player to read the balance for
 * @param erc20Address - The address of the ERC20 token to read the balance for
 * @returns The balance of the player's ERC20 token
 */
export async function readPlayerERC20Balance(
  publicNetwork: SetupPublicNetworkResult,
  playerAddress: Hex,
  erc20Address: Hex
) {
  const balance = await publicNetwork.publicClient.readContract({
    address: erc20Address,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: [playerAddress]
  })

  return Number(balance / 10n ** 18n)
}

/**
 * Read the player's ERC20 allowance
 * @param publicNetwork - The public network to read the allowance from
 * @param playerAddress - The address of the player to read the allowance for
 * @param spenderAddress - The address of the spender to read the allowance for
 * @param erc20Address - The address of the ERC20 token to read the allowance for
 * @returns The allowance of the player's ERC20 token
 */
export async function readPlayerERC20Allowance(
  publicNetwork: SetupPublicNetworkResult,
  playerAddress: Hex,
  spenderAddress: Hex,
  erc20Address: Hex
) {
  const allowance = await publicNetwork.publicClient.readContract({
    address: erc20Address,
    abi: erc20Abi,
    functionName: "allowance",
    args: [playerAddress, spenderAddress]
  })

  return Number(allowance / 10n ** 18n)
}
