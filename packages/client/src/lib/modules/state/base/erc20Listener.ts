import { derived } from "svelte/store"
import { erc20Abi, Hex, parseAbiItem } from "viem"
import { publicNetwork } from "$lib/modules/network"
import { gameConfig, playerAddress, playerERC20Balance } from "$lib/modules/state/base/stores"
import { SetupPublicNetworkResult } from "$lib/mud/setupPublicNetwork"

export function initErc20Listener() {
  let unwatchFrom: (() => void) | undefined
  let unwatchTo: (() => void) | undefined

  derived([publicNetwork, playerAddress, gameConfig], (stores) => stores).subscribe(([publicNetwork, playerAddress, gameConfig]) => {
    if (!publicNetwork || !playerAddress || !gameConfig?.externalAddressesConfig) return

    const address = gameConfig.externalAddressesConfig.erc20Address
    const event = parseAbiItem('event Transfer(address indexed from, address indexed to, uint256 value)')
    const onLogs = () => updatePlayerERC20Balance(publicNetwork, playerAddress as Hex, gameConfig.externalAddressesConfig.erc20Address)

    // Set initial balance
    onLogs();

    unwatchFrom = publicNetwork.publicClient.watchEvent({
      address,
      event,
      args: {
        from: playerAddress as Hex,
      },
      onLogs,
    })

    unwatchTo = publicNetwork.publicClient.watchEvent({
      address,
      event,
      args: {
        to: playerAddress as Hex,
      },
      onLogs,
    })
  }, () => {
    unwatchFrom?.()
    unwatchTo?.()
  })
}

async function updatePlayerERC20Balance(publicNetwork: SetupPublicNetworkResult, playerAddress: Hex, erc20Address: Hex,) {
  const balance = await publicNetwork.publicClient.readContract({
    address: erc20Address,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: [playerAddress],
  })

  playerERC20Balance.set(Number(balance / 10n ** 18n))
}