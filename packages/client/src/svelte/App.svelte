<script lang="ts">
  import { onMount } from "svelte"
  import { ENVIRONMENT } from "@mud/enums"
  import { initSound } from "@modules/sound"
  import { UIState, HighScoreModalActive } from "@modules/ui/stores"
  import { UI } from "@modules/ui/enums"
  import { initOffChainSync } from "@modules/off-chain-sync"
  import { playerId } from "@modules/state/base/stores"
  import { websocketConnected } from "@modules/off-chain-sync/stores"
  import { FullStory, init as initFullstory } from "@fullstory/browser"

  // Tippy CSS
  import "tippy.js/dist/tippy.css"
  import { Modal } from "@components/Main/Modal/state.svelte"
  import Loading from "@components/Loading/Loading.svelte"
  import Main from "@components/Main/Main.svelte"
  import { EMPTY_CONNECTION } from "./modules/utils/constants"
  import HighScore from "@components/Main/HighScore/HighScore.svelte"

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

    // Get static content from CMS
    // initStaticContent()

    // Preload sounds
    initSound()
  })
</script>

<svelte:window />

<div class="context-main">
  {#if $UIState === UI.LOADING}
    <main>
      <Loading {environment} on:done={loadedEnvironment} />
    </main>
  {:else}
    <Main {environment} />
  {/if}
</div>

<Modal />

{#if $HighScoreModalActive}
  <HighScore />
{/if}

<style lang="scss">
  main {
    width: 100vw;
    height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
  }
</style>
