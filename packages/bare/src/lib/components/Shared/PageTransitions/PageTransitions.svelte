<script lang="ts">
  import { transitionFunctions, type TransitionFunction } from "./transitionFunctions"
  import type { TransitionConfig } from "./types"
  import { beforeNavigate } from "$app/navigation"
  import { page } from "$app/state"

  let {
    children,
    config,
    defaultIn = "fade",
    defaultOut = "fade",
    wrapperClass = "",
    id = ""
  }: {
    children: import("svelte").Snippet
    config: TransitionConfig[]
    defaultIn?: TransitionFunction
    defaultOut?: TransitionFunction
    wrapperClass?: string
    id?: string
  } = $props()

  let transitionFunctionIn = $state(transitionFunctions[defaultIn])
  let transitionFunctionOut = $state(transitionFunctions[defaultOut])

  let inParams = $state<any>({ direction: "in", duration: 0 })
  let outParams = $state<any>({ direction: "out", duration: 0 })

  let wanted = $state<TransitionConfig>()
  let transitionKey = $state(`${page.route.id}`)

  beforeNavigate(e => {
    // Determine if and which one we want to use
    wanted = config.find(
      entry =>
        (entry.from === "*" || entry.from === e.from?.route.id) &&
        (entry.to === "*" || entry.to === e.to?.route.id)
    )
    if (wanted) {
      transitionFunctionIn = transitionFunctions?.[wanted?.in?.transition || "none"]
      transitionFunctionOut = transitionFunctions?.[wanted?.out?.transition || "none"]
      inParams = { direction: "in", ...(wanted?.in?.params || {}) }
      outParams = { direction: "out", ...(wanted?.out?.params || {}) }

      // Only update the key if this component should actually transition
      transitionKey = `${e.from?.route.id}-${e.to?.route.id}-${Date.now()}`
    } else {
      transitionFunctionIn = transitionFunctions["none"]
      transitionFunctionOut = transitionFunctions["none"]
      // Keep the same key if no transition should occur
    }
  })
</script>

{#key transitionKey}
  <div
    {id}
    class={wrapperClass}
    in:transitionFunctionIn={inParams as any}
    out:transitionFunctionOut={outParams as any}
  >
    {@render children?.()}
  </div>
{/key}

<style lang="scss">
  .main-area-inner {
    width: 100%;
    height: calc(var(--game-window-height) - 60px);
    display: grid;
    position: relative;
    grid-row: 2 / 3;
    grid-column: 1 / 4;
    grid-template-columns: calc(var(--game-window-width) * 0.46) 1fr calc(
        var(--game-window-width) * 0.46
      );
  }
</style>
