<script lang="ts">
  import "../app.css"
  import "tippy.js/dist/tippy.css"

  import type { LayoutProps } from "./$types"

  import { type Outcome as SanityOutcome } from "@sanity-types"
  import {
    initSound,
    snapshotFactory,
    switchAudio,
    audienceCoughs
  } from "$lib/modules/sound/state.svelte"
  import { initializeSentry } from "$lib/modules/error-handling"
  import { browser } from "$app/environment"
  import { afterNavigate } from "$app/navigation"
  import { onMount } from "svelte"
  import { goto } from "$app/navigation"
  import { initStaticContent, staticContent } from "$lib/modules/content"
  import { publicNetwork } from "$lib/modules/network"
  import { UIState, notificationsRead } from "$lib/modules/ui/state.svelte"
  import { UI } from "$lib/modules/ui/enums"
  import { initOffChainSync } from "$lib/modules/off-chain-sync"
  import { playerId, activeWorldEvent } from "$lib/modules/state/stores"
  import { websocketConnected } from "$lib/modules/off-chain-sync/stores"
  import { EMPTY_ID } from "$lib/modules/state/constants"
  import { errorHandler } from "$lib/modules/error-handling"
  import { removeHash } from "$lib/modules/utils"
  import { walletType as walletTypeStore } from "$lib/modules/network"
  import { page } from "$app/state"

  // Components
  import Spawn from "$lib/components/Spawn/Spawn.svelte"
  import Loading from "$lib/components/Loading/Loading.svelte"
  import {
    ShaderRenderer,
    Shader,
    Modal,
    ModalTarget,
    WorldEventPopup
    // WalletInfo
  } from "$lib/components/Shared"
  import { Outcome } from "$lib/components/Room"
  import EntryKit from "$lib/components/Spawn/EntryKit/EntryKit.svelte"
  import Toasts from "$lib/components/Shared/Toasts/Toasts.svelte"
  // This will persist data across page loads.
  // Used for user settings
  export const snapshot = snapshotFactory()

  let { children, data }: LayoutProps = $props()

  let DEBUG_SHADER = $state(false)
  let initingSound = $state(false)
  let outcomeId = $state("")
  let outcome = $state<SanityOutcome | undefined>()
  let debuggingShader = $derived(import.meta.env.DEV && DEBUG_SHADER)

  const { environment, walletType } = data
  walletTypeStore.set(walletType)

  const environmentLoaded = async () => {
    try {
      // Get content from CMS
      await initStaticContent($publicNetwork.worldAddress)

      UIState.set(UI.SPAWNING)
    } catch (error) {
      errorHandler(error) // CMS error
      goto("/")
    }
  }

  const playerSpawned = () => {
    UIState.set(UI.READY)
  }

  if (browser) {
    initializeSentry()
  }

  // Init of chain sync when player is ready
  $effect(() => {
    if ($playerId && $playerId !== EMPTY_ID && !$websocketConnected) {
      initOffChainSync(data.environment, $playerId)
    }
  })

  // Enable audio on first user interaction
  const enableAudio = async () => {
    if (initingSound) return false

    initingSound = true

    await initSound()

    switchAudio(page)

    audienceCoughs()

    document.removeEventListener("click", enableAudio)
    document.removeEventListener("touchstart", enableAudio)
    document.removeEventListener("keydown", enableAudio)
  }

  onMount(async () => {
    // Remove preloader
    document.querySelector(".preloader")?.remove()

    document.addEventListener("click", enableAudio)
    document.addEventListener("touchstart", enableAudio)
    document.addEventListener("keydown", enableAudio)
  })

  afterNavigate(({ to, from }) => {
    switchAudio(to, from)
    if (to?.url.searchParams.has("spawn")) {
      UIState.set(UI.SPAWNING)
    }
  })
</script>

<svelte:window
  onkeypress={e => {
    if (e.key === "^") {
      DEBUG_SHADER = !DEBUG_SHADER
    }
  }}
  onhashchange={e => {
    outcomeId = new URL(e.newURL).hash.replace("#", "")
    outcome = $staticContent.outcomes.find(o => o._id === outcomeId)
  }}
/>

<div class="bg">
  {#if $UIState === UI.LOADING}
    <div class="context-main">
      <main>
        <Loading {environment} loaded={environmentLoaded} />
      </main>
    </div>
  {:else if $UIState === UI.SPAWNING}
    <div class="context-main">
      <main>
        <Spawn spawned={playerSpawned} {walletType} />
      </main>
    </div>
  {:else}
    <div class="context-main">
      <div class="layer-game">
        {#if !debuggingShader}
          {@render children?.()}
        {/if}
      </div>
    </div>
  {/if}

  {#if $UIState !== UI.LOADING}
    {#if browser}
      {#if debuggingShader}
        <ShaderRenderer />
      {:else}
        <Shader />
      {/if}
    {/if}
  {/if}
</div>

{#key outcomeId}
  {#if outcome}
    {#snippet content()}
      <Outcome {outcome} />
    {/snippet}
    <ModalTarget onclose={removeHash} {content}></ModalTarget>
  {/if}
{/key}

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

<!-- <WalletInfo /> -->

<style lang="scss">
  .context-main {
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
