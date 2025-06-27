<script lang="ts">
  import { circOut as easing } from "svelte/easing"
  import { PageTransitions, CenterBar } from "$lib/components/Shared"
  import { RoomContainer } from "$lib/components/Landlord"

  const config = [
    {
      from: "/(rooms)/landlord",
      to: "/(rooms)/landlord/[roomId]",
      in: {
        transition: "slideFromRight",
        params: {
          duration: 200,
          easing
        }
      },
      out: {
        transition: "slideLeft",
        params: {
          duration: 200,
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
          duration: 200,
          easing
        }
      },
      out: {
        transition: "slideRight",
        params: {
          duration: 200,
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
    overflow-y: scroll;
    height: calc(var(--game-window-height) - 60px);
    background-image: url("/images/texture-5.png");
    background-size: 200px;
  }
</style>
