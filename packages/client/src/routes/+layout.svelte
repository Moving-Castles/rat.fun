<script lang="ts">
  import "../app.css"
  import "tippy.js/dist/tippy.css"
  import "tippy.js/dist/backdrop.css"
  import "tippy.js/animations/shift-away.css"

  import type { LayoutProps, Snapshot } from "./$types"
  import { initSound } from "$lib/modules/sound"
  import { initializeSentry } from "$lib/modules/error-handling"
  import { browser } from "$app/environment"
  import { goto } from "$app/navigation"
  import { onMount } from "svelte"
  import { initStaticContent } from "$lib/modules/content"
  import { publicNetwork } from "$lib/modules/network"
  import { UIState, notificationsRead, adminUnlockedAt } from "$lib/modules/ui/state.svelte"
  import { UI } from "$lib/modules/ui/enums"
  import { initOffChainSync } from "$lib/modules/off-chain-sync"
  import { playerId, activeWorldEvent } from "$lib/modules/state/stores"
  import { websocketConnected } from "$lib/modules/off-chain-sync/stores"
  import { EMPTY_ID } from "$lib/modules/state/constants"
  import { errorHandler } from "$lib/modules/error-handling"
  import { walletType as walletTypeStore } from "$lib/modules/network"

  // Components
  import Spawn from "$lib/components/Spawn/Spawn.svelte"
  import Loading from "$lib/components/Loading/Loading.svelte"
  import { Shader, Modal, ModalTarget, WorldEventPopup } from "$lib/components/Shared"
  import EntryKit from "$lib/components/Spawn/EntryKit/EntryKit.svelte"
  import Toasts from "$lib/components/Shared/Toasts/Toasts.svelte"

  // Managed state
  export const snapshot: Snapshot<string> = {
    capture: () =>
      JSON.stringify({
        adminUnlockedAt: $adminUnlockedAt
      }),
    restore: value => {
      $adminUnlockedAt = JSON.parse(value).adminUnlockedAt
    }
  }

  let { children, data }: LayoutProps = $props()

  const { environment, walletType } = data

  walletTypeStore.set(walletType)

  // Called when loading is complete
  const loaded = async () => {
    try {
      // Get content from CMS
      await initStaticContent($publicNetwork.worldAddress)
      // Loading done. Set the UI state to spawning
      UIState.set(UI.SPAWNING)
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
  if (browser) {
    initializeSentry()
  }

  // Init of chain sync when player is ready
  $effect(() => {
    if ($playerId && $playerId !== EMPTY_ID && !$websocketConnected) {
      initOffChainSync(data.environment, $playerId)
    }
  })

  onMount(async () => {
    // Remove preloader
    document.querySelector(".preloader")?.remove()

    initSound()
  })
</script>

<svelte:window />

<div class="bg">
  {#if $UIState === UI.LOADING}
    <div class="context-main">
      <main>
        <Loading {environment} {loaded} />
      </main>
    </div>
  {:else if $UIState === UI.SPAWNING}
    <div class="context-main">
      <main>
        <Spawn {walletType} {spawned} />
      </main>
    </div>
  {:else}
    <div class="context-main">
      {@render children?.()}
    </div>
  {/if}

  {#if browser}
    <Shader />
  {/if}
  <!-- {#if $UIState !== UI.LOADING}
  {/if} -->
</div>

{#if $activeWorldEvent && !notificationsRead.current.includes($activeWorldEvent.cmsId)}
  {#snippet worldEventContent()}
    <WorldEventPopup />
  {/snippet}
  <ModalTarget
    onclose={() => {
      notificationsRead.set([...notificationsRead.current, $activeWorldEvent.cmsId])
    }}
    content={worldEventContent}
  ></ModalTarget>
{/if}

<EntryKit />
<Modal />
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

  main {
    width: var(--game-window-width);
    height: var(--game-window-height);
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .bg {
    position: fixed;
    inset: 0;
    z-index: var(--z-background);
  }
</style>
