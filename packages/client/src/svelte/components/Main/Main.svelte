<script lang="ts">
  // import RoomPreview from "@svelte/components/Main/Shared/RoomPreview/RoomPreview.svelte"
  import RoomResult from "@components/Main/RightContainer/RoomResult/RoomResult.svelte"
  import { ENVIRONMENT } from "@mud/enums"
  import { UIState } from "@modules/ui/stores"
  import { UI } from "@modules/ui/enums"
  import { getUIState } from "@modules/ui/state.svelte"

  import Spawn from "@components/Spawn/Spawn.svelte"
  import OperatorBar from "@components/Main/OperatorBar/OperatorBar.svelte"
  import FloorBar from "@components/Main/FloorBar/FloorBar.svelte"
  import LeftContainer from "@components/Main/LeftContainer/LeftContainer.svelte"
  import RightContainer from "@components/Main/RightContainer/RightContainer.svelte"
  import ModalTarget from "@components/Main/Modal/ModalTarget.svelte"

  const { transition, route, rooms } = getUIState()
  const { current } = rooms

  let { environment }: { environment: ENVIRONMENT; main: HTMLElement } =
    $props()
</script>

{#snippet mainSnippet(className = "", transitionStyle = "")}
  <div class="main {className}" style={transitionStyle}>
    <OperatorBar />
    <div class="main-area">
      <LeftContainer {environment} />
      <FloorBar />
      <RightContainer {environment} />
    </div>
  </div>
{/snippet}

{#snippet roomSnippet()}
  {#if $current}
    <div class="layer-below">
      <RoomResult
        start={$current && route.current === "room"}
        animationstart={transition.active}
        roomId={$current}
        {environment}
      />
    </div>
  {/if}
{/snippet}

<!-- Routes -->
{#if route.current === "main" && !transition.active}
  <div class="layer-game">
    {@render mainSnippet()}
  </div>
{/if}

{#if route.current === "room" || $current}
  {@render roomSnippet()}
{/if}
<!--  -->

{#if transition.active}
  {#if transition.type === "doorsOpen"}
    {#if transition.active}
      {@render mainSnippet(
        "clone-left",
        `transform: translateX(${transition.progress.current * -50}%)`
      )}
      {@render mainSnippet(
        "clone-right",
        `transform: translateX(${transition.progress.current * 50}%)`
      )}
    {/if}
  {/if}
  {#if transition.type === "doorsClose"}
    {#if transition.active}
      {@render mainSnippet(
        "clone-left",
        `transform: translateX(${(1 - transition.progress.current) * -50}%)`
      )}
      {@render mainSnippet(
        "clone-right",
        `transform: translateX(${(1 - transition.progress.current) * 50}%)`
      )}
    {/if}
  {/if}
{/if}

<pre class="routing">
  transition active: {transition.active}{#if transition.active}
    ---
    transition from: {transition.from}
    transition to: {transition.to}
    transition type: {transition.type}
    transition progress: {transition.progress.current.toFixed(
      5
    )}
  {/if}
  ---
  route: {route.current}
  route params: {JSON.stringify(route.params)}
  ---

</pre>

{#snippet spawn()}
  <Spawn />
{/snippet}

{#if $UIState === UI.SPAWNING}
  <ModalTarget noclose content={spawn} />
{/if}

<style lang="scss">
  .main {
    position: fixed;
    top: 10px;
    left: 10px;
    height: calc(100vh - 20px);
    width: calc(100vw - 20px);
    overflow: hidden;
    border: 1px solid white;
    background: black;
  }

  .layer-below {
    z-index: 0;
  }

  .layer-game {
    z-index: 10;
  }

  .main-area {
    width: 100%;
    height: calc(100vh - 80px);
    display: flex;
    flex-direction: row;
  }

  .main.below {
    z-index: 0;
  }

  .main.clone-left {
    pointer-events: none;
    clip-path: inset(0 50% 0 0);
  }
  .main.clone-right {
    pointer-events: none;
    clip-path: inset(0 0 0 50%);
  }

  .routing {
    position: fixed;
    bottom: 0;
    right: 0;
    z-index: 99;
    background: #030;
    color: grey;
    width: 400px;
    padding: 10px;
  }

  @keyframes moveLeft {
    from {
      transform: translateX(0%);
    }
    to {
      transform: translateX(-100%);
    }
  }

  @keyframes moveRight {
    from {
      transform: translateX(0%);
    }
    to {
      transform: translateX(100%);
    }
  }
</style>
