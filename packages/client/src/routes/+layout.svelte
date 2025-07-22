<script lang="ts">
  import "../app.css"
  import "tippy.js/dist/tippy.css"

  import type { LayoutProps } from "./$types"

  import { onMount } from "svelte"
  import { goto } from "$app/navigation"
  import { initStaticContent } from "$lib/modules/content"
  import { publicNetwork } from "$lib/modules/network"
  import { initSound, playSound } from "$lib/modules/sound"
  import { UIState } from "$lib/modules/ui/stores"
  import { UI } from "$lib/modules/ui/enums"
  import { initOffChainSync } from "$lib/modules/off-chain-sync"
  import { playerId } from "$lib/modules/state/stores"
  import { websocketConnected } from "$lib/modules/off-chain-sync/stores"
  import { EMPTY_ID } from "$lib/modules/state/constants"
  import { outerLayoutTransitionConfig } from "$lib/components/Shared/PageTransitions/transitionConfigs"

  import Spawn from "$lib/components/Spawn/Spawn.svelte"
  import Loading from "$lib/components/Loading/Loading.svelte"
  import { Modal, PageTransitions, WalletInfo } from "$lib/components/Shared"
  import ShaderTest from "$lib/components/Shared/ShaderTest/ShaderTest.svelte"

  let { children, data }: LayoutProps = $props()

  const { environment, walletType } = data

  const environmentLoaded = async () => {
    try {
      // Get content from CMS
      await initStaticContent($publicNetwork.worldAddress)
      UIState.set(UI.SPAWNING)
    } catch (error) {
      console.error(error)
      goto("/")
    }
  }

  const playerSpawned = () => {
    UIState.set(UI.READY)
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
