import { derived } from "svelte/store"
import { erc20Abi, Hex, parseAbiItem } from "viem"
import { publicNetwork } from "$lib/modules/network"
import {
  externalAddressesConfig,
  playerAddress,
  playerERC20Allowance,
  playerERC20Balance
} from "$lib/modules/state/stores"
import { SetupPublicNetworkResult } from "$lib/mud/setupPublicNetwork"

export function initErc20Listener() {
  let unwatchFrom: (() => void) | undefined
  let unwatchTo: (() => void) | undefined
  let unwatchOwner: (() => void) | undefined

  derived([publicNetwork, playerAddress, externalAddressesConfig], stores => stores).subscribe(
    ([publicNetwork, playerAddress, externalAddressesConfig]) => {
      if (!publicNetwork || !playerAddress || !externalAddressesConfig) return

      const address = externalAddressesConfig.erc20Address
      const transferEvent = parseAbiItem(
        "event Transfer(address indexed from, address indexed to, uint256 value)"
      )
      const approvalEvent = parseAbiItem(
        "event Approval(address indexed owner, address indexed spender, uint256 value)"
      )
      const onTransferLogs = () =>
        updatePlayerERC20Balance(
          publicNetwork,
          playerAddress as Hex,
          externalAddressesConfig.erc20Address
        )

      const onApprovalLogs = () => {
        const spenderAddress = externalAddressesConfig.gamePoolAddress
        updatePlayerERC20Allowance(
          publicNetwork,
          playerAddress as Hex,
          spenderAddress,
          externalAddressesConfig.erc20Address
        )
      }

      // Set initial balance and allowance
      onTransferLogs()
      onApprovalLogs()

      unwatchFrom = publicNetwork.publicClient.watchEvent({
        address,
        event: transferEvent,
        args: {
          from: playerAddress as Hex
        },
        onLogs: onTransferLogs
      })

      unwatchTo = publicNetwork.publicClient.watchEvent({
        address,
        event: transferEvent,
        args: {
          to: playerAddress as Hex
        },
        onLogs: onTransferLogs
      })

      unwatchOwner = publicNetwork.publicClient.watchEvent({
        address,
        event: approvalEvent,
        args: {
          owner: playerAddress as Hex
        },
        onLogs: onApprovalLogs
      })
    },
    () => {
      unwatchFrom?.()
      unwatchTo?.()
      unwatchOwner?.()
    }
  )
}

async function updatePlayerERC20Balance(
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

  playerERC20Balance.set(Number(balance / 10n ** 18n))
}

async function updatePlayerERC20Allowance(
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

  playerERC20Allowance.set(Number(allowance / 10n ** 18n))
}
