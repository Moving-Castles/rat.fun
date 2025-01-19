<script lang="ts">
  import { onMount } from "svelte"
  import { ENVIRONMENT } from "@mud/enums"
  import { initSound } from "@modules/sound"
  import { UIState } from "@modules/ui/stores"
  import { UI } from "@modules/ui/enums"

  import {
    rats,
    rooms,
    traits,
    player,
    playerInventory,
    playerRat,
    playerRatTraits,
    playerRatLoadOut,
  } from "@modules/state/base/stores"

  import Loading from "@components/Loading/Loading.svelte"
  import Spawn from "@components/Spawn/Spawn.svelte"
  import CreateRat from "@components/CreateRat/CreateRat.svelte"
  import Nest from "@components/Nest/Nest.svelte"

  export let environment: ENVIRONMENT

  $: console.log("$rats", $rats)
  $: console.log("$rooms", $rooms)
  $: console.log("$traits", $traits)
  $: console.log("$player", $player)
  $: console.log("$playerRat", $playerRat)
  $: console.log("$playerRatTraits", $playerRatTraits)
  $: console.log("$playerRatLoadOut", $playerRatLoadOut)
  $: console.log("$playerInventory", $playerInventory)

  const loadedEnvironment = () => {
    UIState.set(UI.SPAWNING)
  }

  const spawned = async () => {
    try {
      // await initOffChainSync()
      UIState.set(UI.CREATING_RAT)
      // UILocation.set(getPlayerLocation())
    } catch (e) {
      console.error(e)
    }
  }

  const ratCreated = async () => {
    try {
      // await initOffChainSync()
      UIState.set(UI.READY)
      // UILocation.set(getPlayerLocation())
    } catch (e) {
      console.error(e)
    }
  }

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
  {/if}

  {#if $UIState === UI.SPAWNING}
    <main>
      <Spawn on:done={spawned} />
    </main>
  {/if}

  {#if $UIState === UI.CREATING_RAT}
    <main>
      <CreateRat on:done={ratCreated} />
    </main>
  {/if}

  {#if $UIState === UI.READY}
    <Nest {environment} />
  {/if}
</div>

<style lang="scss">
  main {
    width: 100vw;
    height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
  }
</style>
