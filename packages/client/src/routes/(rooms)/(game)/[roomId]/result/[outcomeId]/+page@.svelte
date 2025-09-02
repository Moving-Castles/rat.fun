<script lang="ts">
  // Outcome logs
  import { Outcome, RoomResult } from "$lib/components/Room"
  // import { staticContent } from "$lib/modules/content"
  import { page } from "$app/state"
  import { onMount } from "svelte"
  import { replaceState } from "$app/navigation"
  import {
    stringifyWithBigInt,
    parseWithBigInt
  } from "$lib/components/Room/RoomResult/state.svelte"

  let { data } = $props()

  let entryState = $derived(parseWithBigInt(stringifyWithBigInt(page.state?.entryState)) || {})

  // Clear entryState once the outcome has been successfully viewed
  onMount(() => {
    if (page.state?.entryState) {
      // Clear the entryState from page state to prepare for future room entries
      replaceState(page.url.pathname, {})
    }
  })
</script>

<RoomResult
  roomId={data.roomId}
  valid={entryState?.valid || false}
  hasError={entryState?.error || false}
  errorMessage={entryState?.errorMessage}
  result={entryState?.result || {}}
/>
