<script lang="ts">
  import { onMount } from "svelte"
  import { ENVIRONMENT } from "@mud/enums"
  import { getUIState } from "@modules/ui/state.svelte"
  import { initStaticContent } from "@modules/content"
  import { publicNetwork } from "@modules/network"

  import RatContainer from "@components/Main/RatContainer/RatContainer.svelte"
  import RoomContainer from "@components/Main/RoomContainer/RoomContainer.svelte"
  import RoomResult from "@components/Main/RoomResult/RoomResult.svelte"
  import Floors from "@components/Main/Floors/Floors.svelte"

  function getDoorStyle(side: "left" | "right"): string {
    const progress = transition.progress.current
    // Return empty style if transition is not active, doors will be in their "natural" state (translateX(0%))
    // This means when not transitioning, they are "closed".
    // The visibility of the layer-game wrapper handles whether these closed doors are seen.
    if (!transition.active) return ""
    const isOpening = transition.type === "doorsOpen"
    let offset = 0
    if (side === "left") {
      offset = isOpening ? -(progress * 50) : -50 + progress * 50 // Moves from 0% to -50%
    } else {
      offset = isOpening ? progress * 50 : 50 - progress * 50 // Moves from 0% to 50%
    }
    return `transform: translateX(${offset}%);`
  }

  let { environment }: { environment: ENVIRONMENT } = $props()
  const { transition, route, rooms } = getUIState()
  const { current } = rooms
  let debugTransition = $state(false)

  // Determine if the main game layer (with doors) should be rendered
  let shouldRenderMainGameLayer = $derived(
    route.current === "main" || transition.to === "main"
  )

  onMount(async () => {
    // Get content from CMS
    await initStaticContent($publicNetwork.worldAddress)
  })
</script>

<div class="dust"></div>

{#snippet LeftColumnSlot()}
  <RatContainer />
{/snippet}
{#snippet CenterColumnSlot()}
  <Floors />
{/snippet}
{#snippet RightColumnSlot()}
  <RoomContainer {environment} />
{/snippet}

{#snippet MainAreaLayout(doorType: "left" | "right")}
  <div class="main-area">
    <div class="main-area-left-column">
      {#if doorType === "left"}
        {@render LeftColumnSlot()}
      {/if}
    </div>
    <div class="main-area-center-column">
      {@render CenterColumnSlot()}
    </div>
    <div class="main-area-right-column">
      {#if doorType === "right"}
        {@render RightColumnSlot()}
      {/if}
    </div>
  </div>
{/snippet}

{#if shouldRenderMainGameLayer}
  <div class="layer-game" class:transition-active={transition.active}>
    <div class="door-container">
      <div class="left-door" style={getDoorStyle("left")}>
        <div class="door-content-wrapper">
          {@render MainAreaLayout("left")}
        </div>
      </div>

      <div class="right-door" style={getDoorStyle("right")}>
        <div class="door-content-wrapper">
          {@render MainAreaLayout("right")}
        </div>
      </div>
    </div>
  </div>
{/if}

<!-- What does this mean? -->
{#if route.current === "room" || (transition.from === "room" && transition.active) || $current}
  <div class="layer-below">
    <RoomResult roomId={$current} {environment} />
  </div>
{/if}

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

<style lang="scss">
  // Base layout structure (from original .main class)
  // This is used by .door-content-wrapper
  %main-layout-structure {
    height: 100%;
    width: 100%;
    overflow: hidden;
    display: grid;
    grid-template-rows: var(--header-height, 60px) 1fr;
  }

  .door-content-wrapper {
    @extend %main-layout-structure;
    position: absolute; // Fill the .left-door or .right-door parent
    top: 0;
    left: 0;
    background: transparent; // The content *inside* provides the visuals
    border: none; // Assuming border is on .layer-game or not part of split content
  }

  .layer-game {
    position: fixed;
    // top: 30px;
    left: 0;
    height: var(--game-window-height);
    width: var(--game-window-width);
    z-index: 10;
    border: var(--default-border-style); // Overall game window border
    overflow: hidden; // Clip any door overflow if they animate beyond bounds
    // Though with translateX(+-50%) they shouldn't.
  }

  .door-container {
    position: relative;
    width: 100%;
    height: 100%;
  }

  .left-door,
  .right-door {
    position: absolute;
    top: 0;
    width: 100%; // Each "door" is full width, containing a full-width layout
    height: 100%;
    overflow: hidden; // Essential for clip-path to work on content
    background: transparent; // Door surface is clear; its content is what's seen & clipped
  }

  .left-door {
    left: 0;
    clip-path: inset(0 50% 0 0); // Shows the left 50% of its content
  }

  .right-door {
    // Symmetrical positioning for its clip-path.
    // If using `right:0;` ensure transforms are intuitive. `left:0;` might be simpler.
    left: 0;
    clip-path: inset(0 0 0 50%); // Shows the right 50% of its content
  }

  // .main-area and its columns define the layout within the 1fr part of .door-content-wrapper
  .main-area {
    // This is the second row of the .door-content-wrapper grid
    // No explicit grid-row needed if it's the only 1fr consumer after header
    width: 100%;
    height: var(
      --game-window-height
    ); // Fill its allocated space in the parent grid
    display: grid;
    grid-template-columns: calc(var(--game-window-width) * 0.44) 1fr calc(
        var(--game-window-width) * 0.44
      );
  }

  .main-area-left-column,
  .main-area-center-column,
  .main-area-right-column {
    overflow: hidden; // Prevent content spill from columns
    // Add any other necessary styling for these columns
  }

  // Other styles like .dust, .layer-below, .routing remain as you had them.
  .dust {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    z-index: 1000;
    pointer-events: none;
    background-image: url(/images/dust.png);
    opacity: 0.6;
    background-size: cover;
  }

  .layer-below {
    z-index: 0;
    // margin-top: 30px;
  }

  .routing {
    position: fixed;
    bottom: 0;
    right: 0;
    z-index: 9999; // Highest for debug
    background: #030;
    color: grey;
    width: 400px;
    padding: 10px;
  }
</style>
