<script lang="ts">
  import type { LayoutProps } from "./$types"
  import "../app.css"
  import "tippy.js/dist/tippy.css"
  import "tippy.js/dist/backdrop.css"
  import "tippy.js/animations/shift-away.css"

  import { sdk } from "@farcaster/miniapp-sdk"

  import { initSound } from "$lib/modules/sound"
  import { initializeSentry } from "$lib/modules/error-handling"
  import { browser } from "$app/environment"
  import { goto } from "$app/navigation"
  import { onMount, onDestroy } from "svelte"
  import { initStaticContent } from "$lib/modules/content"
  import { publicNetwork } from "$lib/modules/network"
  import { UIState, lightboxState } from "$lib/modules/ui/state.svelte"
  import { UI } from "$lib/modules/ui/enums"
  // import { activeWorldEvent } from "$lib/modules/state/stores"
  // import {  notificationsRead} from "$lib/modules/ui/state.svelte"
  import { errorHandler } from "$lib/modules/error-handling"
  import {
    environment as environmentStore,
    walletType as walletTypeStore
  } from "$lib/modules/network"

  // Components
  import Spawn from "$lib/components/Spawn/Spawn.svelte"
  import Loading from "$lib/components/Loading/Loading.svelte"
  import {
    ShaderGlobal,
    // AdminUnlockModal,
    // WorldEventPopup,
    Lightbox
  } from "$lib/components/Shared"
  // import { page } from "$app/state"
  import { shaderManager } from "$lib/modules/webgl/shaders/index.svelte"
  import EntryKit from "$lib/components/Spawn/EntryKit/EntryKit.svelte"
  import Toasts from "$lib/components/Shared/Toasts/Toasts.svelte"

  let { children }: LayoutProps = $props()

  // Called when loading is complete
  const loaded = async () => {
    try {
      // Get content from CMS
      // We do not wait, for faster loading time...
      initStaticContent($publicNetwork.worldAddress)
      // Loading done. Set the UI state to spawning
      UIState.set(UI.SPAWNING)
      // Signal readiness to base (farcaster) mini app framework
      sdk.actions.ready()
    } catch (error) {
      errorHandler(error) // CMS error
      goto("/")
    }
  }

  // Called when spawning is complete
  const spawned = () => {
    UIState.set(UI.READY)
  }

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

<!-- {#if $activeWorldEvent && !notificationsRead.current.includes($activeWorldEvent.cmsId)} -->
<!-- {#snippet worldEventContent()}
    <WorldEventPopup /> -->
<!-- {/snippet}
  <ModalTarget
    onclose={() => {
      notificationsRead.set([...notificationsRead.current, $activeWorldEvent.cmsId])
    }}
    content={worldEventContent}
  ></ModalTarget>
{/if} -->

<!-- <AdminUnlockModal /> -->

<EntryKit />
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
