<script lang="ts">
  import { PageTransitions, CenterBar } from "$lib/components/Shared"
  import AdminContainer from "$lib/components/Admin/AdminContainer.svelte"
  import { adminLayoutTransitionConfig } from "$lib/components/Shared/PageTransitions/transitionConfigs"

  let { children } = $props()
</script>

<!-- Grid position 1  -->
<AdminContainer />
<!-- Grid position 2 -->
<CenterBar />

<div class="right-column">
  <PageTransitions config={adminLayoutTransitionConfig}>
    {@render children?.()}
  </PageTransitions>
</div>

<style lang="scss">
  .right-column {
    position: relative;
    overflow-x: hidden;
    overflow-y: scroll;
    height: calc(var(--game-window-height) - 60px);
    background-image: url("/images/texture-5.png");
    background-size: 200px;
  }
</style>
