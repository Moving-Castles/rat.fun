<script lang="ts">
  import type { LayoutProps } from "./$types"
  import "../app.css"
  import "tippy.js/dist/tippy.css"
  import "tippy.js/dist/backdrop.css"
  import "tippy.js/animations/shift-away.css"

  import { initSound } from "$lib/modules/sound"
  import { initializeSentry } from "$lib/modules/error-handling"
  import { browser } from "$app/environment"
  import { goto } from "$app/navigation"
  import { onMount, onDestroy } from "svelte"
  import { page } from "$app/state"
  import { initStaticContent } from "$lib/modules/content"
  import { publicNetwork } from "$lib/modules/network"
  import { UIState, lightboxState } from "$lib/modules/ui/state.svelte"
  import { UI } from "$lib/modules/ui/enums"
  import { WALLET_TYPE } from "$lib/mud/enums"
  import { errorHandler } from "$lib/modules/error-handling"
  import {
    environment as environmentStore,
    walletType as walletTypeStore
  } from "$lib/modules/network"
  import { initializeEntryKit, cleanupEntryKit, userAddress } from "$lib/modules/entry-kit"
  import { getNetworkConfig } from "$lib/mud/getNetworkConfig"

  // Components
  import Spawn from "$lib/components/Spawn/Spawn.svelte"
  import Loading from "$lib/components/Loading/Loading.svelte"
  import { shaderManager } from "$lib/modules/webgl/shaders/index.svelte"
  import { ShaderGlobal, Lightbox, Toasts } from "$lib/components/Shared"
  import { sdk } from "@farcaster/miniapp-sdk"

  let { children }: LayoutProps = $props()

  // Called when loading is complete
  const loaded = async () => {
    try {
      // Ensure EntryKit is initialized before proceeding to spawn
      if ($walletTypeStore === WALLET_TYPE.ENTRYKIT) {
        console.log("[+layout] Ensuring EntryKit is initialized before spawning...")
        const networkConfig = getNetworkConfig($environmentStore, page.url)
        await initializeEntryKit(networkConfig)
        console.log("[+layout] EntryKit ready")
      }

      // Get content from CMS
      // We do not wait, for faster loading time...
      initStaticContent($publicNetwork.worldAddress)
      // Loading done. Set the UI state to spawning
      UIState.set(UI.SPAWNING)
      // Signal readiness to base (farcaster) mini app framework
      sdk.actions.ready()
    } catch (error) {
      errorHandler(error)
      goto("/")
    }
  }

  // Called when spawning is complete
  const spawned = () => {
    UIState.set(UI.READY)
  }

  // Detect wallet disconnection and navigate back to spawn
  $effect(() => {
    // Only monitor disconnections for EntryKit wallet type
    if ($walletTypeStore !== WALLET_TYPE.ENTRYKIT) return

    // Only act when in READY state (not during initial load or spawn flow)
    if ($UIState !== UI.READY) return

    // If user address becomes null, wallet was disconnected
    if ($userAddress === null) {
      console.log("[+layout] Wallet disconnected externally, navigating back to spawn")
      UIState.set(UI.SPAWNING)
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
  })

  onDestroy(() => {
    // Clean up EntryKit if it was initialized
    if ($walletTypeStore === WALLET_TYPE.ENTRYKIT) {
      cleanupEntryKit()
    }

    // Clean up global shader manager when the app unmounts
    shaderManager.destroy()
  })
</script>

<svelte:window />

<div class="bg">
  {#if $UIState === UI.LOADING}
    <Loading environment={$environmentStore} {loaded} />
  {:else if $UIState === UI.SPAWNING}
    <Spawn walletType={$walletTypeStore} {spawned} />
  {:else}
    <div class="context-main">
      {@render children?.()}
    </div>
  {/if}

  {#if browser}
    <ShaderGlobal />
  {/if}
</div>

<Toasts />

{#if lightboxState.isOpen}
  <Lightbox src={lightboxState.src} alt={lightboxState.alt} onClose={() => lightboxState.close()} />
{/if}

<style lang="scss">
  .context-main {
    // display: none;
    width: var(--game-window-width);
    height: var(--game-window-height);
    overflow: hidden;
    position: fixed;
    z-index: var(--z-base);
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
  }

  .bg {
    position: fixed;
    inset: 0;
    z-index: var(--z-background);
    background: #000;
  }
</style>
