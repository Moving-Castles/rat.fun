<script lang="ts">
  import { circOut as easing } from "svelte/easing"
  import CenterBar from "$lib/components/Main/CenterBar/CenterBar.svelte"
  import RoomContainer from "$lib/components/Main/RoomContainer/RoomContainer.svelte"
  import PageTransitions from "$lib/components/Main/Shared/PageTransitions/PageTransitions.svelte"

  const config = [
    {
      from: "/(rooms)/landlord",
      to: "/(rooms)/landlord/[roomId]",
      in: {
        transition: "slideFromRight",
        params: {
          duration: 1000,
          easing
        }
      },
      out: {
        transition: "slideLeft",
        params: {
          duration: 1000,
          easing
        }
      }
    },
    {
      from: "/(rooms)/landlord/[roomId]",
      to: "/(rooms)/landlord",
      in: {
        transition: "slideFromLeft",
        params: {
          duration: 1000,
          easing
        }
      },
      out: {
        transition: "slideRight",
        params: {
          duration: 1000,
          easing
        }
      }
    }
  ]

  let { children } = $props()
</script>

<!-- Grid position 1  -->
<RoomContainer />
<!-- Grid position 2 -->
<CenterBar />

<div class="right-column">
  <PageTransitions {config}>
    {@render children?.()}
  </PageTransitions>
</div>

<style lang="scss">
  .right-column {
    position: relative;
    overflow-x: hidden;
    overflow-y: hidden;
    height: calc(var(--game-window-height) - 60px);
    background-image: url("/images/texture-5.png");
    background-size: 200px;
  }
</style>
