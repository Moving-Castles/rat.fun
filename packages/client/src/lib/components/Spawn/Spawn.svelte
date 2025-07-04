<script lang="ts">
  import type { SetupWalletNetworkResult } from "$lib/mud/setupWalletNetwork"

  import { WALLET_TYPE } from "$lib/mud/enums"
  import { SPAWN_STATE } from "$lib/modules/ui/enums"

  import { store as accountKitStore } from "@latticexyz/account-kit/bundle"

  import { onMount } from "svelte"
  import { publicNetwork } from "$lib/modules/network"
  import { setupWalletNetwork } from "$lib/mud/setupWalletNetwork"
  import { setupBurnerWalletNetwork } from "$lib/mud/setupBurnerWalletNetwork"
  import { initWalletNetwork } from "$lib/initWalletNetwork"

  import { playerERC20Allowance, playerERC20Balance } from "$lib/modules/state/base/stores"

  import Introduction from "$lib/components/Spawn/Introduction/Introduction.svelte"
  import ConnectWalletForm from "$lib/components/Spawn/ConnectWalletForm/ConnectWalletForm.svelte"
  import SpawnForm from "$lib/components/Spawn/SpawnForm/SpawnForm.svelte"
  import TokenForm from "$lib/components/Spawn/TokenForm/TokenForm.svelte"
  import ApprovalForm from "$lib/components/Spawn/ApprovalForm/ApprovalForm.svelte"
  import HeroImage from "$lib/components/Spawn/HeroImage/HeroImage.svelte"

  const { walletType, spawned = () => {} } = $props<{
    walletType: WALLET_TYPE
    spawned: () => void
  }>()

  let currentState = $state<SPAWN_STATE>(SPAWN_STATE.INTRODUCTION)

  async function connectBurner() {
    const wallet = setupBurnerWalletNetwork($publicNetwork)
    const isSpawned = initWalletNetwork(
      wallet,
      wallet.walletClient?.account.address,
      WALLET_TYPE.BURNER
    )

    // Check if player is already spawned
    if (isSpawned) {
      // Connected and spawned - finish spawn process
      spawned()
    } else {
      // New user – show introduction
      currentState = SPAWN_STATE.INTRODUCTION
    }
  }

  onMount(() => {
    if (walletType == WALLET_TYPE.ACCOUNTKIT) {
      /* We get the account kit store state
       * If appAccountClient and userAddress are set the user is connected
       * We set up the wallet network using the appAccountClient
       * and set playerAddress to the user address
       */
      const accountKitStoreState = accountKitStore.getState()
      if (accountKitStoreState.appAccountClient && accountKitStoreState.userAddress) {
        const wallet = setupWalletNetwork(
          $publicNetwork,
          accountKitStoreState.appAccountClient
        ) as SetupWalletNetworkResult

        const isSpawned = initWalletNetwork(wallet, accountKitStoreState.userAddress, walletType)

        if (isSpawned) {
          // Connected and spawned - finish spawn process
          spawned()
        } else {
          // Connected but not spawned - show spawn form
          currentState = SPAWN_STATE.SPAWN_FORM
        }
      } else {
        // New user – show introduction
        currentState = SPAWN_STATE.INTRODUCTION
      }
    } else {
      // For burner wallet, connect immediately
      connectBurner()
    }
  })
</script>

<div class="container">
  {#if currentState === SPAWN_STATE.INTRODUCTION}
    <Introduction onComplete={() => (currentState = SPAWN_STATE.CONNECT_WALLET)} />
  {:else if currentState === SPAWN_STATE.CONNECT_WALLET}
    <ConnectWalletForm
      {walletType}
      onComplete={isSpawned => {
        if (isSpawned) {
          spawned()
        } else {
          currentState = SPAWN_STATE.SPAWN_FORM
        }
      }}
    />
  {:else if currentState === SPAWN_STATE.SPAWN_FORM}
    <SpawnForm
      onComplete={() => {
        if ($playerERC20Balance < 100) {
          currentState = SPAWN_STATE.TOKEN_FORM
        } else {
          if ($playerERC20Allowance < 100) {
            currentState = SPAWN_STATE.APPROVAL_FORM
          } else {
            currentState = SPAWN_STATE.HERO_IMAGE
          }
        }
      }}
    />
  {:else if currentState === SPAWN_STATE.TOKEN_FORM}
    <TokenForm
      onComplete={() => {
        if ($playerERC20Allowance < 100) {
          currentState = SPAWN_STATE.APPROVAL_FORM
        } else {
          currentState = SPAWN_STATE.HERO_IMAGE
        }
      }}
    />
  {:else if currentState === SPAWN_STATE.APPROVAL_FORM}
    <ApprovalForm
      onComplete={() => {
        currentState = SPAWN_STATE.HERO_IMAGE
      }}
    />
  {:else if currentState === SPAWN_STATE.HERO_IMAGE}
    <HeroImage
      onComplete={() => {
        spawned()
      }}
    />
  {/if}
</div>

<style lang="scss">
  .container {
    width: 100vw;
    height: 100vh;
    background: var(--background);
    color: var(--foreground);
    font-family: var(--special-font-stack);
    text-transform: none;
    font-size: var(--font-size-large);
  }
</style>
