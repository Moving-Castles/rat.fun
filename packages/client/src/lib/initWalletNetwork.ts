import type { SetupWalletNetworkResult } from "$lib/mud/setupWalletNetwork";
import type { Hex } from "viem";
import { ENTITY_TYPE } from "contracts/enums"; 
import { get } from "svelte/store"
import { walletNetwork } from "$lib/modules/network";
import { player, playerAddress } from "$lib/modules/state/base/stores";
import { initActionSequencer } from "$lib/modules/action/actionSequencer";
import { initErc20Listener } from "$lib/modules/state/base/erc20Listener";

export function initWalletNetwork(wallet: SetupWalletNetworkResult, address: Hex) {
    walletNetwork.set(wallet);
    playerAddress.set(address);
    initActionSequencer();
    initErc20Listener();
    // Check if player is already spawned
    return get(player)?.entityType === ENTITY_TYPE.PLAYER ? true : false
}