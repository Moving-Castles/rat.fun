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

{#snippet mainSnippet(className = "")}
  <div class="main {className}">
    <OperatorBar />
    <div class="main-area">
      <LeftContainer {environment} />
      <FloorBar />
      <RightContainer {environment} />
    </div>
  </div>
{/snippet}

{#if route.current === "main" && !transition.active}
  {@render mainSnippet()}
{/if}

<!-- <div class="main below"> -->
{#if $current}
  <RoomResult
    start={$current && route.current === "room"}
    animationstart={transition.active}
    roomId={$current}
    {environment}
  />
{/if}
<!-- </div> -->

{#if transition.active}
  {@render mainSnippet("clone-left")}
  {@render mainSnippet("clone-right")}
{/if}

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
    z-index: 1;
    background: black;
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
    z-index: 2;
    clip-path: inset(0 50% 0 0);
    animation: moveLeft 1s ease forwards;
  }
  .main.clone-right {
    pointer-events: none;
    z-index: 2;
    clip-path: inset(0 0 0 50%);
    animation: moveRight 1s ease forwards;
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
