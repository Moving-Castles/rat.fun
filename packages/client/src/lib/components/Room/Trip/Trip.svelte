<script lang="ts">
  import type { EnterRoomReturnValue } from "@server/modules/types"
  import { onMount, onDestroy } from "svelte"
  import { rooms as roomsState } from "$lib/modules/state/stores"
  import { TRIP_STATE } from "$lib/components/Room/Trip/state.svelte"
  import { TripSetup, TripProcessing } from "$lib/components/Room"
  import { staticContent } from "$lib/modules/content"
  import { goto } from "$app/navigation"
  import { stringifyWithBigInt } from "$lib/modules/state/utils"
  import { page } from "$app/state"

  let {
    roomId,
    entryState,
    transitionTo,
    transitionToResultSummary
  }: {
    roomId: string
    entryState: App.PageState["entryState"]
    transitionTo: (newState: TRIP_STATE) => void
    transitionToResultSummary: (result?: EnterRoomReturnValue) => void
  } = $props()

  let timeout: ReturnType<typeof setTimeout> | undefined = $state()
  let destroyed = false
  let result = $derived(entryState?.result)

  // Get static room content from cms
  let staticRoomContent = $derived($staticContent.rooms.find(r => r._id == (roomId ?? "")))

  onDestroy(() => {
    destroyed = true
    clearTimeout(timeout)
  })
</script>

<div class="trip">
  <!-- ### 1. TRIP SETUP ### -->
  {#if entryState?.state === TRIP_STATE.SETUP}
    <TripSetup
      {staticRoomContent}
      onComplete={() => {
        if (destroyed) return
        transitionTo(TRIP_STATE.PROCESSING)
      }}
    />
  {/if}

  <!-- ### 2. TRIP PROCESSING ### -->
  {#if entryState?.state === TRIP_STATE.PROCESSING}
    <TripProcessing
      {result}
      onComplete={async () => {
        transitionTo(TRIP_STATE.RESULTS)
        await goto(`/${page.data.roomId}/result/${result.outcomeId}`, {
          state: {
            entryState: JSON.parse(stringifyWithBigInt(entryState))
          }
        })
      }}
    />
  {/if}
</div>

<style lang="scss">
  .trip {
    height: 100%;
    color: var(--white);
    z-index: var(--z-high);
    font-size: var(--font-size-normal);
    overflow-y: auto;
    top: 32px;
  }
</style>
