import { derived } from "svelte/store"
import { erc20Abi, Hex } from "viem"
import { createQuery, getQueryClientContext, QueryClient } from "@tanstack/svelte-query"
import { publicNetwork } from "$lib/modules/network"
import {
  externalAddressesConfig,
  playerAddress,
  playerERC20Allowance,
  playerERC20Balance
} from "$lib/modules/state/stores"
import { SetupPublicNetworkResult } from "$lib/mud/setupPublicNetwork"

export function refetchBalance(queryClient: QueryClient) {
  queryClient.refetchQueries({ queryKey: ["erc20-query", "balance"] })
}

export function refetchAllowance(queryClient: QueryClient) {
  queryClient.refetchQueries({ queryKey: ["erc20-query", "allowance"] })
}

export function initErc20Listener() {
  let unsubscribeBalance: (() => void) | undefined
  let unsubscribeAllowance: (() => void) | undefined

  const queryClient = getQueryClientContext()

  derived([publicNetwork, playerAddress, externalAddressesConfig], stores => stores).subscribe(
    ([publicNetwork, playerAddress, externalAddressesConfig]) => {
      if (!publicNetwork || !playerAddress || !externalAddressesConfig) return

      const erc20Address = externalAddressesConfig.erc20Address

      // Query ERC20 balance
      const balanceQueryKey = ["erc20-query", "balance", publicNetwork.config.chainId, playerAddress, erc20Address]
      const balanceQuery = createQuery({
        queryKey: balanceQueryKey,
        queryFn: async () => readPlayerERC20Balance(publicNetwork, playerAddress as Hex, erc20Address),
        // TODO reconsider refetching frequency based on alternative solutions, rate limits and other infra expectations
        // Refetch every 10 seconds
        refetchInterval: 10_000,
      })
      unsubscribeBalance = balanceQuery.subscribe((balance) => playerERC20Balance.set(balance.data ?? 0))

      // Query ERC20 allowance
      const spenderAddress = externalAddressesConfig.gamePoolAddress
      const allowanceQueryKey = ["erc20-query", "allowance", publicNetwork.config.chainId, playerAddress, spenderAddress, erc20Address]
      const allowanceQuery = createQuery({
        queryKey: allowanceQueryKey,
        queryFn: async () => readPlayerERC20Allowance(publicNetwork, playerAddress as Hex, spenderAddress, erc20Address),
        // Refetch every minute
        refetchInterval: 60_000,
      })
      unsubscribeAllowance = allowanceQuery.subscribe((allowance) => playerERC20Allowance.set(allowance.data ?? 0))
    },
    () => {
      // Cancel ongoing queries
      queryClient.cancelQueries({ queryKey: ["erc20-query"] })
      // Unsusbscribe store setters
      unsubscribeBalance?.()
      unsubscribeAllowance?.()
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
