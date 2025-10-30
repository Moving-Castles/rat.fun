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
    display: flex;
    flex-direction: column;
    border: var(--default-border-style);

    .main-content {
      position: relative;
      height: var(--game-window-main-height);
    }

    .main-area-inner {
      width: 100%;
      height: 100%;
      display: flex;
      position: relative;
      overflow: visible;
      @media (max-width: 700px) {
        flex-direction: column;
      }
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
