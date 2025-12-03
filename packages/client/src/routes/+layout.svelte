<script lang="ts">
  import type { LayoutProps } from "./$types"
  import "../app.css"
  import "tippy.js/dist/tippy.css"
  import "tippy.js/dist/backdrop.css"
  import "tippy.js/animations/shift-away.css"

  import { initSound } from "$lib/modules/sound"
  import { initializeSentry } from "$lib/modules/error-handling"
  import { browser } from "$app/environment"
  import { onMount, onDestroy } from "svelte"
  import { initStaticContent, setPlayerIdStore } from "$lib/modules/content"
  import { publicNetwork } from "$lib/modules/network"
  import { UIState, lightboxState } from "$lib/modules/ui/state.svelte"
  import { UI } from "$lib/modules/ui/enums"
  import { environment as environmentStore } from "$lib/modules/network"
  import {
    cleanupDrawbridge,
    userAddress,
    getDrawbridge,
    isDrawbridgeInitialized
  } from "$lib/modules/drawbridge"
  import { playerId } from "$lib/modules/state/stores"
  import { initOffChainSync, disconnectOffChainSync } from "$lib/modules/off-chain-sync"
  import { resetEntitiesInitialization } from "$lib/modules/chain-sync"
  import { initErc20Listener } from "$lib/modules/erc20Listener"

  // Components
  import Spawn from "$lib/components/Spawn/Spawn.svelte"
  import Loading from "$lib/components/Loading/Loading.svelte"
  import { shaderManager } from "$lib/modules/webgl/shaders/index.svelte"
  import { ShaderGlobal, Lightbox, Toasts, ManageAllowanceModal } from "$lib/components/Shared"
  import { allowanceModalState, closeAllowanceModal } from "$lib/modules/ui/allowance-modal.svelte"
  import { sdk } from "@farcaster/miniapp-sdk"

  let { children }: LayoutProps = $props()

  // Called when loading is complete
  const loaded = () => {
    // Get content from CMS
    // We do not wait, for faster loading time...
    initStaticContent($publicNetwork.worldAddress)
    // HACK: Set playerId store for trip notifications (avoids circular dependency)
    setPlayerIdStore(playerId)
    // Loading done. Set the UI state to spawning
    UIState.set(UI.SPAWNING)
  }

  const spawned = () => {
    console.log("[+layout] spawned() called")
    // Initialize ERC20 listener (centralized here for all scenarios)
    initErc20Listener()
    UIState.set(UI.READY)
  }

  // Detect wallet disconnection and navigate back to spawn
  // NOTE: We subscribe to $userAddress for reactivity, but verify against
  // drawbridge.getState() to avoid false positives from store sync delays
  $effect(() => {
    // Only act when in READY state (not during initial load or spawn flow)
    if ($UIState !== UI.READY) return

    // If user address becomes null, verify it's a real disconnect
    if ($userAddress === null) {
      // Double-check directly from drawbridge to avoid store race conditions
      if (isDrawbridgeInitialized()) {
        const state = getDrawbridge().getState()
        if (state.userAddress !== null) {
          // Store says null but drawbridge says connected - it's a store sync delay, ignore
          console.log("[+layout] Store shows null but drawbridge has address, ignoring")
          return
        }
      }

      console.log("[+layout] Wallet disconnected externally, navigating back to spawn")
      // Reset entities initialization so it will reinitialize for the new wallet
      resetEntitiesInitialization()
      UIState.set(UI.SPAWNING)
    }
  })

  // Initialize/disconnect websocket based on UI state and playerId
  $effect(() => {
    const currentPlayerId = $playerId
    const isReady = $UIState === UI.READY
    const environment = $environmentStore

    // Connect when UI is ready and we have a valid playerId
    if (
      isReady &&
      currentPlayerId &&
      currentPlayerId !== "0x0000000000000000000000000000000000000000000000000000000000000000"
    ) {
      // console.log("[+layout] Initializing off-chain sync for player:", currentPlayerId)
      initOffChainSync(environment, currentPlayerId)
    }

    // Disconnect when leaving ready state
    return () => {
      if (isReady) {
        // console.log("[+layout] Disconnecting off-chain sync")
        disconnectOffChainSync()
      }
    }
  })

  // Initialize Sentry
  if (browser && !import.meta.env.DEV) {
    initializeSentry()
  }

  onMount(async () => {
    // Remove preloader
    document.querySelector(".preloader")?.remove()

    initSound()

    // Signal readiness to base (farcaster) mini app framework
    sdk.actions.ready()
  })

  onDestroy(() => {
    // Clean up drawbridge
    cleanupDrawbridge()

    // Clean up global shader manager when the app unmounts
    shaderManager.destroy()
  })
</script>

<svelte:window />

<div class="bg">
  {#if $UIState === UI.LOADING}
    <Loading environment={$environmentStore} {loaded} />
  {:else if $UIState === UI.SPAWNING}
    <Spawn {spawned} />
  {:else}
    {@render children?.()}
  {/if}

  {#if browser}
    <ShaderGlobal />
  {/if}
</div>

<Toasts />

{#if lightboxState.isOpen}
  <Lightbox src={lightboxState.src} alt={lightboxState.alt} onClose={() => lightboxState.close()} />
{/if}

{#if allowanceModalState.isOpen}
  <ManageAllowanceModal
    onclose={closeAllowanceModal}
    warningMessage={allowanceModalState.warningMessage}
  />
{/if}

<style lang="scss">
  .bg {
    position: fixed;
    inset: 0;
    z-index: var(--z-background);
    background: #000;
  }
</style>
