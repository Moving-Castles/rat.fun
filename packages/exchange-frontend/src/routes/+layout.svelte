<script lang="ts">
  import "../app.css"
  import "tippy.js/dist/tippy.css"
  import "tippy.js/dist/backdrop.css"
  import "tippy.js/animations/shift-away.css"

  import { onMount, onDestroy } from "svelte"
  import { initSound } from "$lib/modules/sound"
  import { browser } from "$app/environment"
  import { UIState } from "$lib/modules/ui/state.svelte"
  import { UI } from "$lib/modules/ui/enums"
  import { environment as environmentStore } from "$lib/modules/network"

  // Components
  import Loading from "$lib/components/Loading/Loading.svelte"
  import Exchange from "$lib/components/Exchange/Exchange.svelte"
  import { shaderManager } from "$lib/modules/webgl/shaders/index.svelte"
  import EntryKit from "$lib/components/EntryKit/EntryKit.svelte"
  import { ShaderGlobal, Toasts } from "$lib/components/Shared"

  // Called when loading is complete
  const loaded = async () => {
    UIState.set(UI.READY)
  }

  onMount(async () => {
    // Remove preloader
    document.querySelector(".preloader")?.remove()
    initSound()
  })

  onDestroy(() => {
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
      <Exchange />
    </div>
  {/if}

  {#if browser}
    <ShaderGlobal />
  {/if}
</div>

<EntryKit />
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
