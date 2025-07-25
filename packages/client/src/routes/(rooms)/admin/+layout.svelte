<script lang="ts">
  import { onMount } from "svelte"
  import { goto } from "$app/navigation"
  import { PageTransitions, CenterBar } from "$lib/components/Shared"
  import { player } from "$lib/modules/state/stores"
  import AdminContainer from "$lib/components/Admin/AdminContainer.svelte"
  import { adminLayoutTransitionConfig } from "$lib/components/Shared/PageTransitions/transitionConfigs"

  let { children } = $props()

  onMount(() => {
    if (!$player?.masterKey) {
      goto("/")
    }
  })
</script>

{#if $player}
  <!-- Grid position 1  -->
  <AdminContainer />
  <!-- Grid position 2 -->
  <CenterBar />
{/if}

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
