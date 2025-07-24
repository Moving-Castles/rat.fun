<script lang="ts">
  import "../app.css"
  import "tippy.js/dist/tippy.css"

  import type { LayoutProps } from "./$types"

  import { type Outcome as SanityOutcome } from "@sanity-types"
  import { initializeSentry } from "$lib/modules/error-handling"
  import { onMount } from "svelte"
  import { goto } from "$app/navigation"
  import { page } from "$app/state"
  import { initStaticContent, staticContent } from "$lib/modules/content"
  import { publicNetwork } from "$lib/modules/network"
  import { initSound, playSound } from "$lib/modules/sound"
  import { UIState } from "$lib/modules/ui/stores"
  import { UI } from "$lib/modules/ui/enums"
  import { initOffChainSync } from "$lib/modules/off-chain-sync"
  import { playerId } from "$lib/modules/state/stores"
  import { websocketConnected } from "$lib/modules/off-chain-sync/stores"
  import { EMPTY_ID } from "$lib/modules/state/constants"
  import { outerLayoutTransitionConfig } from "$lib/components/Shared/PageTransitions/transitionConfigs"
  import { errorHandler, WebSocketError } from "$lib/modules/error-handling"
  import { Modal, PageTransitions, WalletInfo } from "$lib/components/Shared"
  import { removeHash } from "$lib/modules/utils"

  import Spawn from "$lib/components/Spawn/Spawn.svelte"
  import Loading from "$lib/components/Loading/Loading.svelte"
  import ShaderTest from "$lib/components/Shared/ShaderTest/ShaderTest.svelte"
  import ModalTarget from "$lib/components/Shared/Modal/ModalTarget.svelte"
  import { Outcome } from "$lib/components/Room"

  let { children, data }: LayoutProps = $props()

  let outcomeId = $state("")
  let outcome = $state<SanityOutcome | undefined>()

  const allowedRoutes = ["/(rooms)/(game)/[roomId]"]

  const { environment, walletType } = data

  const environmentLoaded = async () => {
    try {
      // Get content from CMS
      await initStaticContent($publicNetwork.worldAddress)

      // Set next UI state based on the URL
      if (!allowedRoutes.includes(page.route.id)) {
        UIState.set(UI.SPAWNING)
      } else {
        UIState.set(UI.READY)
      }
    } catch (error) {
      errorHandler(error) // CMS error
      goto("/")
    }
  }

  const playerSpawned = () => {
    UIState.set(UI.READY)
  }

  initializeSentry()

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
    console.log(outcomeId)
    outcome = $staticContent.outcomes.find(o => o._id === outcomeId)
  }}
/>

{#if $UIState === UI.LOADING}
  <div class="bg">
    <div class="context-main">
      <main>
        <Loading {environment} loaded={environmentLoaded} />
      </main>
    </div>
  </div>
{:else if $UIState === UI.SPAWNING}
  <div class="bg">
    <div class="context-main">
      <main>
        <Spawn spawned={playerSpawned} {walletType} />
      </main>
    </div>
  </div>
{:else if $UIState === UI.READY}
  <div class="bg">
    <ShaderTest />
    <div class="context-main">
      <div class="layer-game">
        <PageTransitions config={outerLayoutTransitionConfig}>
          {@render children?.()}
        </PageTransitions>
      </div>
    </div>
  </div>
{/if}

{#if outcome}
  {#snippet content()}
    <Outcome {outcome} />
  {/snippet}
  <ModalTarget onclose={removeHash} {content}></ModalTarget>
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
    // background: var(--background);
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
    // background: var(--background);
    // background-image: url("/images/tiles.png");
    // background-size: 300px;
  }

  .layer-game {
    border: var(--default-border-style);
  }
</style>
