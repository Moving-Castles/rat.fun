<script lang="ts">
  import { onMount } from "svelte"
  import { ENVIRONMENT } from "@mud/enums"
  import { initSound } from "@modules/sound"
  import { UILocation, UIState } from "@modules/ui/stores"
  import { LOCATION, UI } from "@modules/ui/enums"

  import Loading from "@components/Loading/Loading.svelte"
  import Spawn from "@components/Spawn/Spawn.svelte"

  import Main from "@components/Main/Main.svelte"
  import { events } from "@modules/herp/index.svelte"

  let { environment }: { environment: ENVIRONMENT } = $props()

  const loadedEnvironment = () => {
    UIState.set(UI.SPAWNING)
  }

  const spawned = async () => {
    UIState.set(UI.READY)
    UILocation.set(LOCATION.MAIN)
  }

  events.forEach(e => {
    $effect(() => {
      console.log("Effect running for ", e.name)
      let a = e.logic()
      console.log(a)
      if (a.condition) {
        a.callback()
      }
    })
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
  {/if}

  {#if $UIState === UI.SPAWNING}
    <main>
      <Spawn on:done={spawned} />
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
