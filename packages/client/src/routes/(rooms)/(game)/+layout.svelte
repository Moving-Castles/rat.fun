<script lang="ts">
  import { PageTransitions, CenterBar } from "$lib/components/Shared"
  import RatContainer from "$lib/components/Rat/RatContainer.svelte"
  import { gameLayoutTransitionConfig } from "$lib/components/Shared/PageTransitions/transitionConfigs"

  let { children } = $props()
</script>

<!-- Grid position 1  -->
<RatContainer />
<!-- Grid position 2 -->
<CenterBar />

<div class="right-column">
  <PageTransitions config={gameLayoutTransitionConfig}>
    {@render children?.()}
  </PageTransitions>
</div>

<style lang="scss">
  .right-column {
    position: relative;
    overflow-x: hidden;
    height: calc(var(--game-window-height) - 60px);
    background-image: url("/images/texture-5.png");
    background-size: 200px;
  }
</style>
