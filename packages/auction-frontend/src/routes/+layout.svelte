<script lang="ts">
  import "../app.css"
  import "tippy.js/dist/tippy.css"
  import "tippy.js/dist/backdrop.css"
  import "tippy.js/animations/shift-away.css"

  import { onMount, onDestroy } from "svelte"
  import { initSound } from "$lib/modules/sound"
  import { initializeSentry } from "$lib/modules/error-handling"
  import { browser } from "$app/environment"
  import { UIState } from "$lib/modules/ui/state.svelte"
  import { UI } from "$lib/modules/ui/enums"
  import { cleanupDrawbridge } from "$lib/modules/drawbridge"

  // Components
  import Loading from "$lib/components/Loading/Loading.svelte"
  import Auction from "$lib/components/Auction/Auction.svelte"
  import { shaderManager } from "$lib/modules/webgl/shaders/index.svelte"
  import { ShaderGlobal, Toasts } from "$lib/components/Shared"

  // Initialize Sentry (only in browser and production)
  if (browser && !import.meta.env.DEV) {
    initializeSentry()
  }

  // Called when loading is complete (network initialized, drawbridge ready)
  const loaded = () => {
    console.log("[+layout] Network and drawbridge ready")
    UIState.set(UI.READY)
  }

  onMount(async () => {
    // Remove preloader
    document.querySelector(".preloader")?.remove()
    initSound()
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
    <Loading {loaded} />
  {:else if $UIState === UI.READY}
    <div class="context-main">
      <Auction />
    </div>
  {/if}

  {#if browser}
    <ShaderGlobal />
  {/if}

  <slot />
</div>

<Toasts />

<style lang="scss">
  .context-main {
    width: 100dvw;
    height: 100dvh;
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
    background: var(--background);
  }
</style>
