<script lang="ts">
  import { ENVIRONMENT } from "$lib/mud/enums"

  import PageTransitions from "$lib/components/Main/Shared/PageTransitions/PageTransitions.svelte"
  import WorldPromptBox from "$lib/components/Main/RoomContainer/WorldPromptBox.svelte"
  import PaneSwitch from "$lib/components/Main/RoomContainer/PaneSwitch.svelte"
  import RatContainer from "$lib/components/Main/RatContainer/RatContainer.svelte"
  import Floors from "$lib/components/Main/Floors/Floors.svelte"

  let { children }: { children: import("svelte").Snippet, environment: ENVIRONMENT } = $props()
</script>

<div class="dust"></div>

<RatContainer />
<Floors />

<div class="scroll-container">
  <WorldPromptBox />
  <PaneSwitch />
  {@render children?.()}
</div>

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

  .black {
    width: 100%;
  }

  .wrapper {
    width: 100%;
    background: red;
  }

  .layer-game {
    position: fixed;
    // top: 30px;
    // left: 20px;
    height: var(--game-window-height);
    width: var(--game-window-width);
    z-index: var(--z-base);
    border: var(--default-border-style); // Overall game window border
    overflow: hidden; // Clip any door overflow if they animate beyond bounds
    // Though with translateX(+-50%) they shouldn't.
  }

  .scroll-container {
    height: var(--game-window-height);
    background: var(--background);

    overflow-y: scroll;
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
    z-index: var(--z-top);
    pointer-events: none;
    background-image: url(/images/dust.png);
    opacity: 0.6;
    background-size: cover;
  }

  .layer-below {
    z-index: var(--z-sub);
  }

  .routing {
    position: fixed;
    bottom: 0;
    right: 0;
    z-index: var(--z-debug);
    background: #030;
    color: grey;
    width: 400px;
    padding: 10px;
  }
</style>
