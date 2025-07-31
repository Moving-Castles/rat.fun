<script lang="ts">
  import "../app.css"
  import "tippy.js/dist/tippy.css"

  import type { LayoutProps } from "./$types"

  import { type Outcome as SanityOutcome } from "@sanity-types"
  import { initializeSentry } from "$lib/modules/error-handling"
  import { browser } from "$app/environment"
  import { onMount } from "svelte"
  import { goto } from "$app/navigation"
  import { page } from "$app/state"
  import { initStaticContent, staticContent } from "$lib/modules/content"
  import { publicNetwork } from "$lib/modules/network"
  import { initSound, playSound } from "$lib/modules/sound"
  import { UIState, notificationsRead } from "$lib/modules/ui/state.svelte"
  import { UI } from "$lib/modules/ui/enums"
  import { initOffChainSync } from "$lib/modules/off-chain-sync"
  import { playerId, activeWorldEvent } from "$lib/modules/state/stores"
  import { websocketConnected } from "$lib/modules/off-chain-sync/stores"
  import { EMPTY_ID } from "$lib/modules/state/constants"
  import { outerLayoutTransitionConfig } from "$lib/components/Shared/PageTransitions/transitionConfigs"
  import { errorHandler } from "$lib/modules/error-handling"
  import { Modal, PageTransitions, WalletInfo } from "$lib/components/Shared"
  import { removeHash } from "$lib/modules/utils"

  import Spawn from "$lib/components/Spawn/Spawn.svelte"
  import Loading from "$lib/components/Loading/Loading.svelte"
  import ShaderTest from "$lib/components/Shared/ShaderTest/ShaderTest.svelte"
  import ModalTarget from "$lib/components/Shared/Modal/ModalTarget.svelte"
  import WorldEventPopup from "$lib/components/Shared/WorldEventPopup/WorldEventPopup.svelte"
  import { Outcome } from "$lib/components/Room"

  let { children, data }: LayoutProps = $props()

  let outcomeId = $state("")
  let outcome = $state<SanityOutcome | undefined>()

  const { environment, walletType } = data

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

  onMount(async () => {
    // Remove preloader
    document.querySelector(".preloader")?.remove()
    // Preload sounds
    initSound()
    // Play background sound
    playSound("tcm", "podBg", true, true)
  })
</script>

<svelte:window
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
    {#if browser}
      <ShaderTest />
    {/if}
    <div class="context-main">
      <div class="layer-game">
        <PageTransitions config={outerLayoutTransitionConfig}>
          {@render children?.()}
        </PageTransitions>
      </div>
    </div>
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

<Modal />

<!-- <WalletInfo {walletType} {environment} /> -->

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

    &.over {
      z-index: 100;
      background: black;
    }
  }

  .layer-game {
    border: var(--default-border-style);
  }
</style>
