<script lang="ts">
  import { onMount } from "svelte"
  import { ENVIRONMENT } from "@mud/enums"
  import { initSound } from "@modules/sound"
  import { UIState } from "@modules/ui/stores"
  import { UI } from "@modules/ui/enums"
  import { initOffChainSync } from "@modules/off-chain-sync"
  import { playerId } from "@modules/state/base/stores"
  import { websocketConnected } from "@modules/off-chain-sync/stores"
  import { FullStory, init as initFullstory } from "@fullstory/browser"
  import { EMPTY_CONNECTION } from "./modules/utils/constants"

  // Tippy CSS
  import "tippy.js/dist/tippy.css"

  import { Modal } from "@components/Main/Modal/state.svelte"
  import Loading from "@components/Loading/Loading.svelte"
  import Main from "@components/Main/Main.svelte"

  let { environment }: { environment: ENVIRONMENT } = $props()

  const loadedEnvironment = () => {
    UIState.set(UI.SPAWNING)
  }

  // Init of chain sync when player is ready
  $effect(() => {
    if ($playerId && $playerId !== EMPTY_CONNECTION && !$websocketConnected) {
      console.log("Initializing off-chain sync")
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
  })
</script>

<svelte:window />

<div class="bg">
  <div class="context-main">
    {#if $UIState === UI.LOADING}
      <main>
        <Loading {environment} on:done={loadedEnvironment} />
      </main>
    {:else}
      <Main {environment} />
    {/if}

    <Modal />
  </div>
</div>

<style lang="scss">
  .context-main {
    width: var(--game-window-width);
    height: var(--game-window-height);
    overflow: hidden;
    position: fixed;
    z-index: 1;
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
    z-index: 0;
    background: var(--background);
    background-image: url("/images/tiles.png");
    background-size: 300px;
  }
</style>
