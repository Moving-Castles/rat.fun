<script lang="ts">
  import { onDestroy, onMount } from "svelte"
  import { page } from "$app/state"
  import { fade } from "svelte/transition"

  import { WALLET_TYPE } from "$lib/mud/enums"
  import { SPAWN_STATE } from "$lib/modules/ui/enums"

  import { playSound } from "$lib/modules/sound"

  import { UIState } from "$lib/modules/ui/state.svelte"
  import { UI } from "$lib/modules/ui/enums"

  import { publicNetwork } from "$lib/modules/network"
  import { setupWalletNetwork } from "$lib/mud/setupWalletNetwork"
  import { setupBurnerWalletNetwork } from "$lib/mud/setupBurnerWalletNetwork"
  import { initWalletNetwork } from "$lib/initWalletNetwork"
  import { sessionClient, status, EntryKitStatus } from "$lib/modules/entry-kit"
  import { shaderManager } from "$lib/modules/webgl/shaders/index.svelte"
  import { backgroundMusic } from "$lib/modules/sound/stores"

  import { strings } from "$lib/modules/strings"

  import Introduction from "$lib/components/Spawn/Introduction/Introduction.svelte"
  import ConnectWalletForm from "$lib/components/Spawn/ConnectWalletForm/ConnectWalletForm.svelte"
  import SessionSetup from "$lib/components/Spawn/SessionSetup/SessionSetup.svelte"
  import SpawnForm from "$lib/components/Spawn/SpawnForm/SpawnForm.svelte"
  import HeroImage from "$lib/components/Spawn/HeroImage/HeroImage.svelte"
  import { Marquee } from "$lib/components/Shared"

  const { walletType, spawned = () => {} } = $props<{
    walletType: WALLET_TYPE
    spawned: () => void
  }>()

  let currentState = $state<SPAWN_STATE>(SPAWN_STATE.INTRODUCTION)

  const onIntroductionComplete = () => (currentState = SPAWN_STATE.CONNECT_WALLET)

  async function checkForBurnerWallet() {
    const wallet = setupBurnerWalletNetwork($publicNetwork)
    const isSpawned = initWalletNetwork(
      wallet,
      wallet.walletClient?.account.address,
      WALLET_TYPE.BURNER
    )

    // Check if player is already spawned
    if (
      isSpawned ||
      (page.route.id === "/(main)/(game)/[tripId]" && !page.url.searchParams.has("spawn"))
    ) {
      // Connected and spawned - finish spawn process
      spawned()
    } else {
      // New user – show introduction
      currentState = SPAWN_STATE.INTRODUCTION
    }
  }

  const onWalletConnectionComplete = () => {
    // For burner wallet, go straight to spawn form
    if (walletType === WALLET_TYPE.BURNER) {
      currentState = SPAWN_STATE.SPAWN_FORM
    }
    // For EntryKit, the effect will handle transition once state settles
    // Don't transition yet - wait for delegation check to complete
  }

  // Listen to changes in entrykit status
  $effect(() => {
    // Only react to EntryKit status changes
    if (walletType !== WALLET_TYPE.ENTRYKIT) return

    console.log("[Spawn] EntryKit status changed:", $status)

    switch ($status) {
      case EntryKitStatus.CONNECTED:
        // Wallet connected but needs session setup
        if (currentState !== SPAWN_STATE.SESSION_SETUP) {
          console.log("[Spawn] Status CONNECTED → transitioning to SESSION_SETUP")
          currentState = SPAWN_STATE.SESSION_SETUP
        }
        break

      case EntryKitStatus.READY:
        // Session is fully ready - check if already spawned
        if (!$sessionClient) return

        console.log("[Spawn] Status READY → checking spawn status")
        const wallet = setupWalletNetwork($publicNetwork, $sessionClient)
        const isSpawned = initWalletNetwork(wallet, $sessionClient.userAddress, walletType)

        if (isSpawned) {
          console.log("[Spawn] Already spawned, completing spawn flow")
          spawned()
        } else {
          console.log("[Spawn] Not spawned yet, transitioning to SPAWN_FORM")
          currentState = SPAWN_STATE.SPAWN_FORM
        }
        break

      // Other statuses (DISCONNECTED, CONNECTING, SETTING_UP_SESSION) don't require action
      // The UI components handle showing appropriate screens
    }
  })

  onMount(async () => {
    if (walletType === WALLET_TYPE.BURNER) {
      checkForBurnerWallet()
    }

    // HACK
    // When already spawn we are passing through here quickly
    // And music might be started but onDestroy is not called
    // Only start music if the UI state has not already changed from SPAWNING
    if ($UIState === UI.SPAWNING) {
      console.log("[Spawn] Starting music")
      await new Promise(resolve => setTimeout(resolve, 700))
      backgroundMusic.play({ category: "ratfunMusic", id: "spawn", loop: true })
      shaderManager.setShader("clouds", true)
    }
  })

  function stopMusic() {
    console.log("[Spawn] Stopping music")
    backgroundMusic.stop()
  }

  onDestroy(() => {
    console.log("[Spawn] onDestroy called")
    stopMusic()
  })
</script>

<div class="container">
  <div class="marquee-container top" in:fade|global={{ duration: 200, delay: 1000 }}>
    <Marquee speed={5} numberOfCopies={10} direction="left">
      <p class="marquee-text">{strings.topMarqueeText}</p>
    </Marquee>
  </div>

  <div class="marquee-container bottom" in:fade|global={{ duration: 200, delay: 1000 }}>
    <Marquee speed={5} numberOfCopies={10} direction="right">
      <p class="marquee-text">{strings.bottomMarqueeText}</p>
    </Marquee>
  </div>

  <div class="content">
    {#if currentState === SPAWN_STATE.INTRODUCTION}
      <Introduction onComplete={onIntroductionComplete} />
    {:else if currentState === SPAWN_STATE.CONNECT_WALLET}
      <ConnectWalletForm {walletType} onComplete={onWalletConnectionComplete} />
    {:else if currentState === SPAWN_STATE.SESSION_SETUP}
      <SessionSetup
        onComplete={() => {
          console.log("[Spawn] Session setup completed, effect will handle transition")
        }}
      />
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
    width: 100dvw;
    height: 100dvh;
    color: white;
    font-family: var(--special-font-stack);
    text-transform: none;
    font-size: var(--font-size-normal);
    position: relative;

    .content {
      position: relative;
      z-index: 1;
    }

    .marquee-container {
      position: absolute;
      left: 0;
      width: 100%;
      height: 40px;
      z-index: 1;
      background: rgba(0, 0, 0, 0.5);
      font-size: var(--font-size-normal);
      font-family: var(--typewriter-font-stack);
      text-transform: uppercase;

      .marquee-text {
        padding: 0;
        margin: 0;
        height: 40px;
        line-height: 40px;
      }

      &.top {
        top: 0;
      }

      &.bottom {
        bottom: 0;
      }
    }
  }
</style>
