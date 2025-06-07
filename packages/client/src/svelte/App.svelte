<script lang="ts">
  import { onMount } from "svelte"
  import { ENVIRONMENT } from "@mud/enums"
  import { initSound } from "@modules/sound"
  import { getUIState } from "@modules/ui/state.svelte"
  import { UIState, UILocation } from "@modules/ui/stores"
  import { UI, LOCATION } from "@modules/ui/enums"
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
  import Spawn from "@components/Spawn/Spawn.svelte"

  let { environment }: { environment: ENVIRONMENT } = $props()

  let { rooms } = getUIState()

  const environmentLoaded = () => {
    UIState.set(UI.SPAWNING)
  }

  const playerSpawned = () => {
    UIState.set(UI.READY)
    UILocation.set(LOCATION.MAIN)
  }

  // Init of chain sync when player is ready
  $effect(() => {
    if ($playerId && $playerId !== EMPTY_CONNECTION && !$websocketConnected) {
      // console.log("Initializing off-chain sync")
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

    const currentHash = window.location.hash.replace("#", "")
    if (currentHash !== "") rooms.preview(currentHash)
  })
</script>

<svelte:window
  onhashchange={async e => {
    // console.log("hash changes")
    const url = new URL(e.newURL)
    const newHash = url.hash.replaceAll("#", "")
    const currentHash = new URL(e.oldURL).hash.replaceAll("#", "")

    const queryParams = new URLSearchParams(document.location.search)

    // console.log(queryParams)

    if (newHash !== "" && newHash !== currentHash) {
      if (currentHash !== "") {
        rooms.back()
        await new Promise(r => setTimeout(r, 500))
        rooms.preview(
          newHash,
          !!queryParams.get("mine") || false,
          !!queryParams.get("animated") || true
        )
      } else {
        // console.log(
        //   "mine",
        //   !queryParams.get("mine") || false,
        //   !!queryParams.get("animated") || true
        // )
        rooms.preview(
          newHash,
          !!queryParams.get("mine") || false,
          !!queryParams.get("animated") || true
        )
        // rooms.preview(newHash)
      }
    }
  }}
/>

<div class="bg">
  <div class="context-main">
    {#if $UIState === UI.LOADING}
      <main>
        <Loading {environment} loaded={environmentLoaded} />
      </main>
    {:else if $UIState === UI.SPAWNING}
      <main>
        <Spawn spawned={playerSpawned} />
      </main>
    {:else if $UIState === UI.READY}
      <Main {environment} />
    {:else}
      <main>ERROR</main>
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
    background-image: url("/images/textures/2.jpg");
    background-size: 300px;
  }
</style>
