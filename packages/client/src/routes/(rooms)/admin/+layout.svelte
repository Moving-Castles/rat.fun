<script lang="ts">
  import { goto } from "$app/navigation"
  import { page } from "$app/state"
  import { CenterBar } from "$lib/components/Shared"
  import { AdminContainer } from "$lib/components/Admin"
  import { player } from "$lib/modules/state/stores"
  import { PageTransitions } from "$lib/components/Shared"
  import { gameLayoutTransitionConfig } from "$lib/components/Shared/PageTransitions/transitionConfigs"

  let { children } = $props()

  $effect(() => {
    if ($player) {
      if (!$player.masterKey) {
        if (page.route.id === "/(rooms)/admin/[roomId]") {
          goto(`/${page.params.roomId}`)
        } else {
          goto("/")
        }
      }
    }
  })
</script>

<div class="span-all">
  <PageTransitions config={gameLayoutTransitionConfig}>
    {@render children?.()}
  </PageTransitions>
</div>

<style lang="scss">
  .span-all {
    grid-column: 1/4;
    position: relative;
    overflow-x: hidden;
    overflow-y: scroll;
    height: calc(var(--game-window-height) - 60px);
    background-image: url("/images/texture-5.png");
    background-size: 200px;
  }
</style>
