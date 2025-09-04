<script lang="ts">
  // Outcome logs
  import { Trip } from "$lib/components/Room"
  // import { staticContent } from "$lib/modules/content"
  import { page } from "$app/state"
  import { onMount } from "svelte"
  import { replaceState } from "$app/navigation"
  import { stringifyWithBigInt, parseWithBigInt } from "$lib/modules/state/utils"
  import { createTripTransitions } from "$lib/modules/page-state/trip-transitions"
  import { frozenRat, frozenRoom } from "$lib/components/Room/Trip/state.svelte"

  let { data } = $props()

  $inspect("result", data.entryState)

  frozenRoom.set(data.entryState.frozenRoom)
  frozenRat.set(data.entryState.frozenRat)

  let entryState = $state(
    page.state?.entryState
      ? parseWithBigInt(stringifyWithBigInt(page.state.entryState))
      : data?.entryState || {}
  )

  let { transitionTo, transitionToResultSummary } = $derived(createTripTransitions(entryState))

  onMount(() => {
    if (page.state?.entryState) {
      // Clear the entryState from page state
      replaceState(page.url.pathname, {})
    }
  })
</script>

<Trip roomId={data.roomId} {entryState} {transitionTo} {transitionToResultSummary} />
