<script lang="ts">
  import { TopBar } from "$lib/components/Shared"

  let { children }: { children: import("svelte").Snippet } = $props()
</script>

<div class="main-area">
  <TopBar />
  <div class="main-content">
    <div class="main-area-inner">
      {@render children?.()}
    </div>
  </div>
</div>

<div class="dust"></div>

<style lang="scss">
  .main-area {
    width: 100%;
    height: var(--game-window-height);
    display: grid;
    grid-template-rows: 60px var(--game-window-main-height);
    grid-template-columns: calc(var(--game-window-width) * 0.46) 1fr calc(
        var(--game-window-width) * 0.46
      );
    border: var(--default-border-style);

    .main-content {
      grid-row: 2 / 3;
      grid-column: 1 / 4;
      position: relative;
      height: var(--game-window-main-height);
    }

    .main-area-inner {
      width: 100%;
      height: 100%;
      display: grid;
      position: relative;
      grid-row: 2 / 3;
      grid-column: 1 / 4;
      grid-template-columns: calc(var(--game-window-width) * 0.46) 1fr calc(
          var(--game-window-width) * 0.46
        );
    }
  }
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
</style>
