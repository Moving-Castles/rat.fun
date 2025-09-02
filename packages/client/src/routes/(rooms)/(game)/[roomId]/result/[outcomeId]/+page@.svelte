<script lang="ts">
  // Outcome logs
  import { RoomResult } from "$lib/components/Room"
  // import { staticContent } from "$lib/modules/content"
  import { page } from "$app/state"
  import { onMount } from "svelte"
  import { replaceState } from "$app/navigation"
  import { stringifyWithBigInt, parseWithBigInt } from "$lib/modules/state/utils"
  import { createRoomResultTransitions } from "$lib/modules/page-state/room-result-transitions"
  import { frozenRat, frozenRoom } from "$lib/components/Room/RoomResult/state.svelte"

  let { data } = $props()

  $inspect("result", data.entryState)

  frozenRoom.set(data.entryState.frozenRoom)
  frozenRat.set(data.entryState.frozenRat)

  let entryState = $derived(
    page.state?.entryState
      ? parseWithBigInt(stringifyWithBigInt(page.state.entryState))
      : data?.entryState || {}
  )

  let { transitionTo, transitionToResultSummary } = $derived(
    createRoomResultTransitions(entryState)
  )

  onMount(() => {
    if (page.state?.entryState) {
      // Clear the entryState from page state
      replaceState(page.url.pathname, {})
    }
  })
</script>

<RoomResult roomId={data.roomId} {entryState} {transitionTo} {transitionToResultSummary} />
