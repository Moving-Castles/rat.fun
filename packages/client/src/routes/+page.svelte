<script lang="ts">
  import { onMount } from "svelte"
  import { ENVIRONMENT } from "$lib/mud/enums"
  import { initSound } from "$lib/modules/sound"
  import { getUIState } from "$lib/modules/ui/state.svelte"
  import { UIState, UILocation } from "$lib/modules/ui/stores"
  import { UI, LOCATION } from "$lib/modules/ui/enums"
  import { initOffChainSync } from "$lib/modules/off-chain-sync"
  import { playerId } from "$lib/modules/state/base/stores"
  import { websocketConnected } from "$lib/modules/off-chain-sync/stores"
  import { FullStory, init as initFullstory } from "@fullstory/browser"
  import { EMPTY_CONNECTION } from "$lib/modules/utils/constants"
  import Loading from "$lib/components/Loading/Loading.svelte"
  import Main from "$lib/components/Main/Main.svelte"
  import Spawn from "$lib/components/Spawn/Spawn.svelte"

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