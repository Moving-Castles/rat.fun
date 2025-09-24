<script lang="ts">
  import { TRIP_STATE } from "$lib/components/Room/Trip/state.svelte"
  import { TripReport, NormalResultSummary, RatDeadResultSummary } from "$lib/components/Room"
  import { page } from "$app/state"
  import { onMount } from "svelte"
  import { replaceState } from "$app/navigation"
  import { stringifyWithBigInt, parseWithBigInt } from "$lib/modules/state/utils"
  import { createTripTransitions } from "$lib/modules/page-state/trip-transitions"
  import { frozenRat, frozenRoom } from "$lib/components/Room/Trip/state.svelte"

  let { data } = $props()

  console.log("### routes/(main)/(game)/[roomId]/result/[outcomeId]/+page@.svelte ###")

  frozenRoom.set(data.entryState.frozenRoom)
  frozenRat.set(data.entryState.frozenRat)

  let entryState = $state(
    page.state?.entryState
      ? parseWithBigInt(stringifyWithBigInt(page.state.entryState))
      : data?.entryState || {}
  )
  let result = $derived(entryState?.result)
  let { transitionToResultSummary } = $derived(createTripTransitions(entryState))

  onMount(() => {
    if (page.state?.entryState) {
      // Clear the entryState from page state
      replaceState(page.url.pathname, {})
    }
  })
</script>

{#if entryState?.state === TRIP_STATE.RESULTS || (entryState?.state
    ?.toLowerCase()
    .includes("summary") && result)}
  <TripReport
    {result}
    onComplete={() => {
      transitionToResultSummary(result)
    }}
  />
{/if}

{#if entryState?.state === TRIP_STATE.SUMMARY}
  <NormalResultSummary />
{/if}

<!-- Result Summary: Rat Dead -->
{#if entryState?.state === TRIP_STATE.SUMMARY_RAT_DEAD}
  <RatDeadResultSummary />
{/if}

<!-- Error -->
{#if entryState?.state === TRIP_STATE.ERROR}
  <div class="error">
    {entryState?.errorMessage}
  </div>
{/if}
