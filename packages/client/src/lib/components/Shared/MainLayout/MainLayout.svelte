<script lang="ts">
  import { ENVIRONMENT } from "$lib/mud/enums"
  import { PageTransitions, TopBar } from "$lib/components/Shared"
  import { mainLayoutTransitionConfig } from "$lib/components/Shared/PageTransitions/transitionConfigs"

  let { children }: { children: import("svelte").Snippet; environment: ENVIRONMENT } = $props()
</script>

<div class="main-area">
  <TopBar />

  <div class="main-content">
    <PageTransitions id="main" wrapperClass="main-area-inner" config={mainLayoutTransitionConfig}>
      {@render children?.()}
    </PageTransitions>
  </div>
</div>

<div class="dust"></div>

<style lang="scss">
  .main-area {
    width: 100%;
    height: var(--game-window-height);
    display: grid;
    grid-template-rows: 60px 1fr;
    grid-template-columns: calc(var(--game-window-width) * 0.46) 1fr calc(
        var(--game-window-width) * 0.46
      );

    border: var(--default-border-style);

    .main-content {
      grid-row: 2 / 3;
      grid-column: 1 / 4;
      position: relative;
      overflow: hidden;
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
