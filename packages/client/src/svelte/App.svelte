<script lang="ts">
  import { onMount } from "svelte"
  import { ENVIRONMENT } from "@mud/enums"
  import { initSound } from "@modules/sound"
  import { UILocation, UIState, CurrentRoomId } from "@modules/ui/stores"
  import { LOCATION, UI } from "@modules/ui/enums"
  // import { player, rat } from "@modules/state/base/stores"

  import Loading from "@components/Loading/Loading.svelte"
  import Spawn from "@components/Spawn/Spawn.svelte"
  import CreateRat from "@components/CreateRat/CreateRat.svelte"
  import Room from "@components/Room/Room.svelte"
  import PvPRoom from "@components/Room/PvPRoom.svelte"
  import Lobby from "@components/Lobby/Lobby.svelte"

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
      UILocation.set(LOCATION.NEST)
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
    {#if $UILocation === LOCATION.NEST}
      <Main {environment} />
    {/if}
    {#if $UILocation === LOCATION.LOBBY}
      <Lobby />
    {/if}
    {#if $UILocation === LOCATION.ROOM}
      <Room {environment} roomId={$CurrentRoomId} />
    {/if}
    {#if $UILocation === LOCATION.PVP_ROOM}
      <PvPRoom {environment} roomId={$CurrentRoomId} />
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
