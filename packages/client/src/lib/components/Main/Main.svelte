<script lang="ts">
  import { ENVIRONMENT } from "$lib/mud/enums"
  import OperatorBar from "$lib/components/Main/OperatorBar/OperatorBar.svelte"
  import PaneSwitch from "$lib/components/Main/RoomContainer/PaneSwitch.svelte"
  import PageTransitions from "./Shared/PageTransitions/PageTransitions.svelte"

  const config = [
    {
      from: "/(rooms)/rat",
      to: "/(rooms)/landlord",
      in: {
        transition: "fade"
      },
      out: {
        transition: "none"
      }
    },
    {
      from: "/(rooms)/landlord",
      to: "/(rooms)/rat",
      in: {
        transition: "fade"
      },
      out: {
        transition: "none"
      }
    }
  ]

  let { children }: { children: import("svelte").Snippet; environment: ENVIRONMENT } = $props()
</script>

<div class="main-area">
  <div class="header">
    <OperatorBar />

    <PaneSwitch />
  </div>

  <div class="main-content">
    <PageTransitions wrapperClass="main-area-inner" {config}>
      {@render children?.()}
    </PageTransitions>
  </div>
</div>

<div class="dust"></div>

<style lang="scss">
  .black {
    width: 100%;
  }

  .main-area {
    width: 100%;
    height: var(--game-window-height);
    display: grid;
    grid-template-rows: 60px 1fr;
    grid-template-columns: calc(var(--game-window-width) * 0.46) 1fr calc(
        var(--game-window-width) * 0.46
      );

    .header {
      grid-column: 1 / span 3;
      display: flex;
      a {
        color: white;
      }
    }

    .main-content {
      grid-row: 2 / 3;
      grid-column: 1 / 4;
      position: relative;
      overflow: hidden;
    }
  }

  .layer-game {
    position: fixed;
    height: var(--game-window-height);
    width: var(--game-window-width);
    z-index: var(--z-base);
    border: var(--default-border-style); // Overall game window border
    overflow: hidden; // Clip any door overflow if they animate beyond bounds
  }

  .wrapper {
    width: 100%;
    background: red;
  }

  .layer-game {
    position: fixed;
    height: var(--game-window-height);
    width: var(--game-window-width);
    z-index: var(--z-base);
    border: var(--default-border-style); // Overall game window border
    overflow: hidden; // Clip any door overflow if they animate beyond bounds
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
