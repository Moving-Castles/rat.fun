<script lang="ts">
  import { onMount } from "svelte"
  import { ENVIRONMENT } from "@mud/enums"
  import { initSound } from "@modules/sound"
  import { UILocation, UIState } from "@modules/ui/stores"
  import { LOCATION, UI } from "@modules/ui/enums"

  import Loading from "@components/Loading/Loading.svelte"
  import Spawn from "@components/Spawn/Spawn.svelte"
  import CreateRat from "@components/CreateRat/CreateRat.svelte"

  import Main from "@components/Main/Main.svelte"

  export let environment: ENVIRONMENT

  const loadedEnvironment = () => {
    UIState.set(UI.SPAWNING)
  }

  const spawned = async () => {
    UIState.set(UI.CREATING_RAT)
  }

  const ratCreated = async () => {
    try {
      UIState.set(UI.READY)
      UILocation.set(LOCATION.MAIN)
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
    {#if $UILocation === LOCATION.MAIN}
      <Main {environment} />
    {/if}
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
