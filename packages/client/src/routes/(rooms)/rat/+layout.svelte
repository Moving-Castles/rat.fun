<script lang="ts">
  import CenterBar from "$lib/components/Main/CenterBar/CenterBar.svelte"
  import RatContainer from "$lib/components/Main/RatContainer/RatContainer.svelte"
  import PageTransitions from "$lib/components/Main/Shared/PageTransitions/PageTransitions.svelte"

  const config = [
    {
      from: "/(rooms)/rat",
      to: "/(rooms)/rat/[roomId]",
      in: {
        transition: "slideFromRight",
        params: {
          duration: 1000
        }
      },
      out: {
        transition: "slideLeft",
        params: {
          duration: 1000
        }
      }
    },
    {
      from: "/(rooms)/rat/[roomId]",
      to: "/(rooms)/rat",
      in: {
        transition: "slideFromRight"
      },
      out: {
        transition: "slideLeft"
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
  }
</style>
