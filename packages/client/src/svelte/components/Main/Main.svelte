<script lang="ts">
  import { ENVIRONMENT } from "@mud/enums"
  import { UIState } from "@modules/ui/stores"
  import { UI } from "@modules/ui/enums"
  import { getUIState } from "@modules/ui/state.svelte"

  import Spawn from "@components/Spawn/Spawn.svelte"
  import OperatorBar from "@components/Main/OperatorBar/OperatorBar.svelte"
  import Floors from "@components/Main/Floors/Floors.svelte"
  import LeftContainer from "@components/Main/LeftContainer/LeftContainer.svelte"
  import RightContainer from "@components/Main/RightContainer/RightContainer.svelte"
  import ModalTarget from "@components/Main/Modal/ModalTarget.svelte"
  import RoomResult from "@components/Main/RoomResult/RoomResult.svelte"

  function getDoorStyle(side: "left" | "right"): string {
    const progress = transition.progress.current

    if (!transition.active) return ""

    const isOpening = transition.type === "doorsOpen"

    let offset = 0

    if (side === "left") {
      offset = isOpening
        ? -(progress * 50) // from 0% to -50%
        : -50 + progress * 50 // from -50% to 0%
    } else {
      offset = isOpening
        ? progress * 50 // from 0% to 50%
        : 50 - progress * 50 // from 100% to 0%
    }

    return `transform: translateX(${offset}%);`
  }

  const { transition, route, rooms } = getUIState()
  const { current, myCurrent } = rooms
  let debugTransition = $state(false)

  let { environment }: { environment: ENVIRONMENT } = $props()
</script>

{#snippet mainSnippet(className = "", transitionStyle = "")}
  <div class="main {className}" style={transitionStyle}>
    <OperatorBar />
    <div class="main-area">
      <LeftContainer {environment} />
      <Floors />
      <RightContainer />
    </div>
  </div>
{/snippet}

{#snippet roomSnippet()}
  {#if $current || $myCurrent}
    <RoomResult
      start={($current || $myCurrent) && route.current === "room"}
      animationstart={transition.active}
      roomId={$current}
      {environment}
    />
  {/if}
{/snippet}

<!-- Routes -->
{#if route.current === "main" || transition.to === "main"}
  <div class="layer-game" class:transition-active={transition.active}>
    <div class="door-container">
      <div class="left-door" style={getDoorStyle("left")}>
        {@render mainSnippet()}
      </div>
      <div class="right-door" style={getDoorStyle("right")}>
        {@render mainSnippet()}
      </div>
    </div>
  </div>
{/if}

{#if route.current === "room" || transition.from === "room" || $current}
  <div class="layer-below">
    {@render roomSnippet()}
  </div>
{/if}
<!--  -->

{#if debugTransition}
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
    background: black;
  }

  .layer-below {
    z-index: 0;
  }

  .layer-game {
    position: fixed;
    z-index: 10;
  }

  .main-area {
    width: 100%;
    height: calc(100vh - 80px);
    display: flex;
    flex-direction: row;
  }

  .main.clone-left {
    // pointer-events: none;
    clip-path: inset(0 50% 0 0);
  }
  .main.clone-right {
    // pointer-events: none;
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

  .door-container {
    position: relative;
    width: 100vw;
    height: 100vh;

    &.transition-active {
      // pointer-events: none;
    }
  }

  .left-door,
  .right-door {
    position: absolute;
    top: 0;
    width: 100%;
    height: 100%;
    overflow: hidden;
    background: black;
    // pointer-events: none;
  }

  .left-door {
    left: 0;
    clip-path: inset(0 50% 0 0);
  }

  .right-door {
    right: 0;
    clip-path: inset(0 0 0 50%);
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
