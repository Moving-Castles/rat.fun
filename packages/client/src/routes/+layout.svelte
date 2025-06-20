<script lang="ts">
  import "../app.css"
  import "tippy.js/dist/tippy.css"

  import type { LayoutProps } from './$types';

  import Loading from "$lib/components/Loading/Loading.svelte"
  import Spawn from "$lib/components/Spawn/Spawn.svelte"
  import PageTransitions from "$lib/components/Main/Shared/PageTransitions/PageTransitions.svelte"
  
  import { page } from "$app/state"
  import { Modal } from "$lib/components/Main/Modal/state.svelte"
  import { onMount } from "svelte"
  import { initStaticContent } from "$lib/modules/content"
  import { publicNetwork } from "$lib/modules/network"
  import { initSound, playSound } from "$lib/modules/sound"
  import { UIState, UILocation } from "$lib/modules/ui/stores"
  import { UI, LOCATION } from "$lib/modules/ui/enums"
  import { initOffChainSync } from "$lib/modules/off-chain-sync"
  import { playerId } from "$lib/modules/state/base/stores"
  import { websocketConnected } from "$lib/modules/off-chain-sync/stores"
  import { FullStory, init as initFullstory } from "@fullstory/browser"
  import { EMPTY_CONNECTION } from "$lib/modules/utils/constants"
  import { ENVIRONMENT } from "$lib/mud/enums"

  let { children, data }: LayoutProps = $props()

  const getEnvironment = () => {
    const hostname = page.url.hostname

    if (hostname.includes("rhodolite") || page.url.searchParams.has("rhodolite")) {
      return ENVIRONMENT.RHODOLITE
    }

    if (hostname.includes("pyrope") || page.url.searchParams.has("pyrope")) {
      return ENVIRONMENT.PYROPE
    }

    return ENVIRONMENT.DEVELOPMENT
  }
  const environment = getEnvironment()

  console.log("THE ENVIRONMENT IS ", environment)

  const environmentLoaded = async () => {
    console.log($publicNetwork.worldAddress)
    // Get content from CMS
    await initStaticContent($publicNetwork.worldAddress)
    UIState.set(UI.SPAWNING)
  }

  const playerSpawned = () => {
    UIState.set(UI.READY)
    UILocation.set(LOCATION.MAIN)
  }

  const transitionsConfig = [
    {
      from: "/(rooms)/[roomId]",
      to: "/(rooms)/[roomId]/enter",
      out: {
        transition: "wipe",
        params: {
          duration: 2000,
          direction: "in"
        }
      },
      in: {
        transition: "fade",
        params: {
          duration: 1000,
          delay: 200
        }
      },
    },
    {
      from: "/(rooms)/[roomId]/enter",
      to: "*",
      out: {
        transition: "wipe",
        params: {
          duration: 2000,
          direction: "in"
        }
      },
      in: {
        transition: "fade",
        params: {
          duration: 1000,
          delay: 200
        }
      },
    }
  ]

  // Init of chain sync when player is ready
  $effect(() => {
    if ($playerId && $playerId !== EMPTY_CONNECTION && !$websocketConnected) {
      console.log("Initializing off-chain sync", environment)
      initOffChainSync(environment, $playerId)

      // Fullstory analytics
      initFullstory({
        orgId: "o-1RP0ZA-na1",
        debug: true,
      })

      FullStory("setIdentity", {
        uid: $playerId,
        properties: {
          displayName: $playerId,
        },
      })
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

<div class="bg">
  <div class="context-main">
    {#if $UIState === UI.LOADING}
      <main>
        <Loading environment={environment} loaded={environmentLoaded} />
      </main>
    {:else if $UIState === UI.SPAWNING}
      <main>
        <Spawn spawned={playerSpawned} />
      </main>
    {:else if $UIState === UI.READY}
      <div class="layer-game">
        <PageTransitions config={transitionsConfig} >
          {@render children?.()}
        </PageTransitions>
      </div>
    {/if}
  </div>
</div>

<Modal />


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
    background: var(--background);
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
    background: var(--background);
    background-image: url("/images/textures/2.jpg");
    background-size: 300px;
  }
</style>