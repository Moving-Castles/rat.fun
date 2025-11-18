<script lang="ts">
  import "../app.css"
  import "tippy.js/dist/tippy.css"
  import "tippy.js/dist/backdrop.css"
  import "tippy.js/animations/shift-away.css"

  import { onMount, onDestroy } from "svelte"
  import { initSound } from "$lib/modules/sound"
  import { browser } from "$app/environment"
  import { page } from "$app/state"
  import { UIState } from "$lib/modules/ui/state.svelte"
  import { UI } from "$lib/modules/ui/enums"
  import { environment as environmentStore } from "$lib/modules/network"
  import { initializeDrawbridge, cleanupDrawbridge } from "$lib/modules/drawbridge"
  import { getNetworkConfig } from "$lib/mud/getNetworkConfig"

  // Components
  import Loading from "$lib/components/Loading/Loading.svelte"
  import Auction from "$lib/components/Auction/Auction.svelte"
  import { shaderManager } from "$lib/modules/webgl/shaders/index.svelte"
  import { ShaderGlobal, Toasts } from "$lib/components/Shared"

  // Called when loading is complete
  const loaded = async () => {
    // Initialize drawbridge in wallet-only mode (no session setup)
    console.log("[+layout] Initializing drawbridge in wallet-only mode...")
    const networkConfig = getNetworkConfig($environmentStore, page.url)
    await initializeDrawbridge(networkConfig)
    console.log("[+layout] drawbridge ready")

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
    <Loading environment={$environmentStore} {loaded} />
  {:else if $UIState === UI.READY}
    <div class="context-main">
      <Auction />
    </div>
  {/if}

  {#if browser}
    <ShaderGlobal />
  {/if}
</div>

<Toasts />

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
