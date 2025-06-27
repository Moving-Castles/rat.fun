<script lang="ts">
  import { circOut as easing } from "svelte/easing"
  import { RatContainer } from "$lib/components/Rat"
  import { PageTransitions, CenterBar } from "$lib/components/Shared"

  const config = [
    {
      from: "/(rooms)/rat",
      to: "/(rooms)/rat/[roomId]",
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
      from: "/(rooms)/rat/[roomId]",
      to: "/(rooms)/rat",
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
<RatContainer />
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
    height: calc(var(--game-window-height) - 60px);
    background-image: url("/images/texture-5.png");
    background-size: 200px;
  }
</style>
