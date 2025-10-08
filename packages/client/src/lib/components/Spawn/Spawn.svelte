<script lang="ts">
  import { onDestroy, onMount } from "svelte"
  import { page } from "$app/state"
  import { Howl } from "howler"

  import { WALLET_TYPE } from "$lib/mud/enums"
  import { SPAWN_STATE } from "$lib/modules/ui/enums"

  import { playSound } from "$lib/modules/sound"

  import { UIState } from "$lib/modules/ui/state.svelte"
  import { UI } from "$lib/modules/ui/enums"

  import { publicNetwork } from "$lib/modules/network"
  import { setupWalletNetwork } from "$lib/mud/setupWalletNetwork"
  import { setupBurnerWalletNetwork } from "$lib/mud/setupBurnerWalletNetwork"
  import { initWalletNetwork } from "$lib/initWalletNetwork"
  import { entryKitSession } from "$lib/modules/entry-kit/stores"
  import { shaderManager } from "$lib/modules/webgl/shaders/index.svelte"

  import Introduction from "$lib/components/Spawn/Introduction/Introduction.svelte"
  import ConnectWalletForm from "$lib/components/Spawn/ConnectWalletForm/ConnectWalletForm.svelte"
  import SpawnForm from "$lib/components/Spawn/SpawnForm/SpawnForm.svelte"
  import HeroImage from "$lib/components/Spawn/HeroImage/HeroImage.svelte"

  const { walletType, spawned = () => {} } = $props<{
    walletType: WALLET_TYPE
    spawned: () => void
  }>()

  let currentState = $state<SPAWN_STATE>(SPAWN_STATE.INTRODUCTION)

  let backgroundMusic: Howl | undefined = $state()

  const onIntroductionComplete = () => (currentState = SPAWN_STATE.CONNECT_WALLET)

  async function connectBurner() {
    const wallet = setupBurnerWalletNetwork($publicNetwork)
    const isSpawned = initWalletNetwork(
      wallet,
      wallet.walletClient?.account.address,
      WALLET_TYPE.BURNER
    )

    // Check if player is already spawned
    if (
      isSpawned ||
      (page.route.id === "/(main)/(game)/[roomId]" && !page.url.searchParams.has("spawn"))
    ) {
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

  // Listen to changes the entrykit session
  // ???
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

  onMount(async () => {
    // ???
    if (walletType === WALLET_TYPE.BURNER) {
      connectBurner()
    }

    // HACK
    // When already spawn we are passing through here quickly
    // And music might be started but onDestroy is not called
    // Only start music if the UI state has not already changed from SPAWNING
    if ($UIState === UI.SPAWNING) {
      backgroundMusic = playSound("ratfunMusic", "spawn")
    }

    // HACK
    // Wait a bit some whatever is needed for the shader to start is loaded...
    await new Promise(resolve => setTimeout(resolve, 1000))
    shaderManager.setShader("clouds")
  })

  onDestroy(() => {
    // Stop background music
    if (backgroundMusic) {
      backgroundMusic.stop()
      backgroundMusic = undefined
    }
  })
</script>

<div class="container">
  <div class="content">
    {#if currentState === SPAWN_STATE.INTRODUCTION}
      <Introduction onComplete={onIntroductionComplete} />
    {:else if currentState === SPAWN_STATE.CONNECT_WALLET}
      <ConnectWalletForm {walletType} onComplete={onWalletConnectionComplete} />
    {:else if currentState === SPAWN_STATE.SPAWN_FORM}
      <SpawnForm
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
</div>

<style lang="scss">
  .container {
    width: 100vw;
    height: 100vh;
    color: white;
    font-family: var(--special-font-stack);
    text-transform: none;
    font-size: var(--font-size-normal);
    position: relative;
  }

  .content {
    position: relative;
    z-index: 1;
  }
</style>
