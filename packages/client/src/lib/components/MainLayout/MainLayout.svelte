<script lang="ts">
  import { TopBar } from "$lib/components/Shared"

  let { children }: { children: import("svelte").Snippet } = $props()
</script>

<div class="context-main">
  <div class="main-area">
    <TopBar />
    <div class="main-content">
      <div class="main-area-inner">
        {@render children?.()}
      </div>
    </div>
  </div>
</div>

<div class="dust"></div>

<style lang="scss">
  .context-main {
    width: var(--game-window-width);
    height: var(--game-window-height);
    overflow: hidden;
    position: fixed;
    z-index: var(--z-base);
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
  }
  .main-area {
    width: 100%;
    height: var(--game-window-height);
    display: flex;
    flex-direction: column;
    border: var(--default-border-style);

    .main-content {
      position: relative;
      height: var(--game-window-main-height);

      @media (max-width: 800px) {
        height: calc(
          var(--game-window-height) - var(--top-bar-total-height-phone) - 2px
        ); /* 2px for borders */
      }
    }

    .main-area-inner {
      width: 100%;
      height: 100%;
      display: flex;
      position: relative;
      overflow: visible;
      @media (max-width: 800px) {
        flex-direction: column;
      }
    }
  }
  .dust {
    position: fixed;
    top: 0;
    left: 0;
    width: 100dvw;
    height: 100dvh;
    z-index: var(--z-top);
    pointer-events: none;
    background-image: url(/images/dust.png);
    opacity: 0.6;
    background-size: cover;
  }
</style>
