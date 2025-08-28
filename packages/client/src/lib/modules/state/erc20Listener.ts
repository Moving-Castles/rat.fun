import { derived } from "svelte/store"
import { erc20Abi, Hex } from "viem"
import { publicNetwork } from "$lib/modules/network"
import {
  externalAddressesConfig,
  playerAddress,
  playerERC20Allowance,
  playerERC20Balance
} from "$lib/modules/state/stores"
import { SetupPublicNetworkResult } from "$lib/mud/setupPublicNetwork"

let balanceInterval: NodeJS.Timeout | undefined
let allowanceInterval: NodeJS.Timeout | undefined
let currentNetwork: SetupPublicNetworkResult | null = null
let currentPlayerAddress: Hex | null = null
let currentExternalAddresses: any = null

export async function refetchAllowance() {
  if (currentNetwork && currentPlayerAddress && currentExternalAddresses) {
    await updateAllowance(currentNetwork, currentPlayerAddress, currentExternalAddresses)
  }
}

export async function refetchBalance() {
  if (currentNetwork && currentPlayerAddress && currentExternalAddresses) {
    await updateBalance(currentNetwork, currentPlayerAddress, currentExternalAddresses.erc20Address)
  }
}

async function updateBalance(
  network: SetupPublicNetworkResult,
  playerAddr: Hex,
  erc20Address: Hex
) {
  try {
    const balance = await readPlayerERC20Balance(network, playerAddr, erc20Address)
    playerERC20Balance.set(balance)
  } catch (error) {
    console.error("Failed to update ERC20 balance:", error)
  }
}

async function updateAllowance(
  network: SetupPublicNetworkResult,
  playerAddr: Hex,
  externalAddresses: any
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

export function initErc20Listener() {
  derived([publicNetwork, playerAddress, externalAddressesConfig], stores => stores).subscribe(
    ([publicNetwork, playerAddress, externalAddressesConfig]) => {
      // Clear existing intervals
      if (balanceInterval) clearInterval(balanceInterval)
      if (allowanceInterval) clearInterval(allowanceInterval)

      if (!publicNetwork || !playerAddress || !externalAddressesConfig) {
        currentNetwork = null
        currentPlayerAddress = null
        currentExternalAddresses = null
        return
      }

      // Store current values for refetch functions
      currentNetwork = publicNetwork
      currentPlayerAddress = playerAddress as Hex
      currentExternalAddresses = externalAddressesConfig

      const erc20Address = externalAddressesConfig.erc20Address

      // Initial fetch and set up balance interval
      updateBalance(publicNetwork, playerAddress as Hex, erc20Address)
      balanceInterval = setInterval(() => {
        updateBalance(publicNetwork, playerAddress as Hex, erc20Address)
      }, 2_000) // Refetch every 2 seconds

      // Initial fetch and set up allowance interval
      updateAllowance(publicNetwork, playerAddress as Hex, externalAddressesConfig)
      allowanceInterval = setInterval(() => {
        updateAllowance(publicNetwork, playerAddress as Hex, externalAddressesConfig)
      }, 60_000) // Refetch every minute
    },
    () => {
      // Cleanup intervals on unsubscribe
      if (balanceInterval) clearInterval(balanceInterval)
      if (allowanceInterval) clearInterval(allowanceInterval)
      currentNetwork = null
      currentPlayerAddress = null
      currentExternalAddresses = null
    }
  )
}

async function readPlayerERC20Balance(
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

async function readPlayerERC20Allowance(
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
