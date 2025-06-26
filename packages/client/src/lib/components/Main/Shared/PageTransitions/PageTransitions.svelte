<script lang="ts">
  import { page } from "$app/state"
  import {
    transitionFunctions,
    type TransitionConfig,
    type TransitionFunction
  } from "./transitions"
  import { beforeNavigate } from "$app/navigation"

  let {
    children,
    config,
    defaultIn = "fade",
    defaultOut = "fade"
  }: {
    children: import("svelte").Snippet
    config: TransitionConfig[]
    defaultIn?: TransitionFunction
    defaultOut?: TransitionFunction
  } = $props()

  let transitionFunctionIn = $state(transitionFunctions[defaultIn])
  let transitionFunctionOut = $state(transitionFunctions[defaultOut])

  let inParams = $state<Record<string, string | number>>({ duration: 0 })
  let outParams = $state<Record<string, string | number>>({ duration: 0 })

  let wanted = $state<TransitionConfig>()
  let display = $state("contents")

  beforeNavigate(e => {
    // Determine if and which one we want to use
    wanted = config.find(
      entry =>
        ((entry.from === "*" || entry.from === e.from?.route.id) && entry.to === "*") ||
        entry.to === e.to?.route.id
    )
    if (wanted) {
      display = "block"
      transitionFunctionIn = transitionFunctions?.[wanted?.in?.transition || "none"]
      transitionFunctionOut = transitionFunctions?.[wanted?.out?.transition || "none"]
      inParams = wanted?.in?.params || {}
      outParams = wanted?.out?.params || {}
    } else {
      transitionFunctionIn = transitionFunctions["none"]
      transitionFunctionOut = transitionFunctions["none"]
    }
  })

  $effect(() => {
    console.log("wanted", $state.snapshot(wanted))
  })
</script>

{#key `${wanted?.from}-${wanted?.to}`}
  <div in:transitionFunctionIn={inParams} out:transitionFunctionOut={outParams}>
    {@render children?.()}
  </div>
{/key}

<style>
  .transition-wrapper {
    position: relative;
  }
</style>
