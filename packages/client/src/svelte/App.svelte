<script lang="ts">
  import { onMount } from "svelte"
  import { ENVIRONMENT } from "@mud/enums"
  import { initSound } from "@modules/sound"
  import { UIState } from "@svelte/modules/ui/stores"
  import { UI } from "@modules/ui/enums"

  import Loading from "@components/Loading/Loading.svelte"
  import Spawn from "./components/Spawn/Spawn.svelte"
  import Nest from "@svelte/components/Nest/Nest.svelte"

  export let environment: ENVIRONMENT

  const loadedEnvironment = () => {
    UIState.set(UI.SPAWNING)
  }

  const spawned = async () => {
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

<main>
  <div class="context-main">
    {#if $UIState === UI.LOADING}
      <Loading {environment} on:done={loadedEnvironment} />
    {/if}

    {#if $UIState === UI.SPAWNING}
      <Spawn on:done={spawned} />
    {/if}

    {#if $UIState === UI.READY}
      <Nest />
    {/if}
  </div>
</main>

<style lang="scss">
  main {
    width: 100vw;
    height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .context-main {
    width: 800px;
    z-index: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
  }
</style>
