<script lang="ts">
  import type { SetupWalletNetworkResult } from "$lib/mud/setupWalletNetwork"

  import { onMount } from "svelte"

  import { WALLET_TYPE } from "$lib/mud/enums"
  import { SPAWN_STATE } from "$lib/modules/ui/enums"

  import { publicNetwork } from "$lib/modules/network"
  import { setupWalletNetwork } from "$lib/mud/setupWalletNetwork"
  import { setupBurnerWalletNetwork } from "$lib/mud/setupBurnerWalletNetwork"
  import { initWalletNetwork } from "$lib/initWalletNetwork"
  import { entryKitSession } from "$lib/mud/stores"

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

  const onIntroductionComplete = () => (currentState = SPAWN_STATE.CONNECT_WALLET)

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

  const onWalletConnectionComplete = () => {
    if (walletType === WALLET_TYPE.ENTRYKIT) {
      // This is now just here for the burner. Entrykit is moved to $effect call below
    } else {
      // Burner
      currentState = SPAWN_STATE.SPAWN_FORM
    }
  }

  $effect(() => {
    if ($entryKitSession) {
      if ($entryKitSession?.account?.client && $entryKitSession.userAddress) {
        const wallet = setupWalletNetwork($publicNetwork, $entryKitSession)
        const isSpawned = initWalletNetwork(wallet, $entryKitSession.userAddress, walletType)

        if (isSpawned) {
          spawned()
        } else {
          currentState = SPAWN_STATE.SPAWN_FORM
        }
      }
    }
  })

  onMount(() => {
    if (walletType === WALLET_TYPE.BURNER) connectBurner()
  })
</script>

<div class="container">
  {#if currentState === SPAWN_STATE.INTRODUCTION}
    <Introduction onComplete={onIntroductionComplete} />
  {:else if currentState === SPAWN_STATE.CONNECT_WALLET}
    <ConnectWalletForm {walletType} onComplete={onWalletConnectionComplete} />
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
