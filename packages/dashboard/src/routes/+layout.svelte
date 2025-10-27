<script lang="ts">
  import "../app.css"
  import "tippy.js/dist/tippy.css"
  import "tippy.js/dist/backdrop.css"
  import "tippy.js/animations/shift-away.css"

  import type { LayoutProps } from "./$types"
  import { goto } from "$app/navigation"
  import { initStaticContent, staticContent } from "$lib/modules/content"
  import { publicNetwork } from "$lib/modules/network"
  import { UIState } from "$lib/modules/ui/state.svelte"
  import { UI } from "$lib/modules/ui/enums"
  import { errorHandler } from "$lib/modules/error-handling"
  import { environment as environmentStore } from "$lib/modules/network"

  import Loading from "$lib/components/Loading/Loading.svelte"
  import Toasts from "$lib/components/Shared/Toasts/Toasts.svelte"

  let { children }: LayoutProps = $props()

  // Called when loading is complete
  const loaded = async () => {
    try {
      // Get content from CMS
      // We do not wait, for faster loading time...
      initStaticContent($publicNetwork.worldAddress)
      // Loading done. Set the UI state to ready
      UIState.set(UI.READY)
    } catch (error) {
      errorHandler(error) // CMS error
      goto("/")
    }
  }

  let totalDistributedValue = $derived.by(() => {
    if ($staticContent.outcomes) {
      console.log("START for rats")
      return $staticContent.outcomes.reduce(
        (a, current) => {
          const ratValue = current?.ratValueChange ?? 0
          const newRatValue = a.rat + ratValue
          const tripValue = current?.tripValueChange || 0
          const newTripValue = a.trip + tripValue

          return {
            rat: newRatValue,
            trip: newTripValue
          }
        },
        { rat: 0, trip: 0 }
      )
    } else {
      return { rat: 0, trip: 0 }
    }
  })
</script>

{#if $UIState === UI.LOADING}
  <Loading
    environment={$environmentStore}
    loaded={() => {
      loaded()
    }}
  />
{:else}
  <div class="context-main">
    <header class="menu">
      <div>
        <h1>RAT.FUN DASHBOARD: {$environmentStore}</h1>
        <hr />
      </div>
      <div>
        <h1>RATS: {totalDistributedValue.rat} / TRIPS: {totalDistributedValue.trip}</h1>
        <hr />
      </div>
    </header>
    <div class="content">
      {@render children?.()}
    </div>
  </div>
{/if}

<Toasts />

<style lang="scss">
  .context-main {
    // display: none;
    width: 100vw;
    padding: 20px;
  }

  .menu {
    padding: 4px;
    display: flex;
    justify-content: space-between;
  }

  .menu {
    // position: sticky;
    // top: 0;
    // left: 0;
    font-weight: bold;
  }
</style>
