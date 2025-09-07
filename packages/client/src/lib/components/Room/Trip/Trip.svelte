<script lang="ts">
  import type { EnterRoomReturnValue } from "@server/modules/types"
  import { onDestroy } from "svelte"
  import { rooms as roomsState } from "$lib/modules/state/stores"
  import { TRIP_STATE } from "$lib/components/Room/Trip/state.svelte"
  import {
    TripSetup,
    TripProcessing,
    TripReport,
    NormalResultSummary,
    RatDeadResultSummary
  } from "$lib/components/Room"
  import { staticContent } from "$lib/modules/content"

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

  let timeout: ReturnType<typeof setTimeout> = $state()
  let destroyed = false

  // Get room info from global store based on id
  let room = $derived($roomsState?.[roomId ?? ""])
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
      onComplete={() => {
        transitionTo(TRIP_STATE.RESULTS)
      }}
    />
  {/if}

  {#if entryState?.state === TRIP_STATE.RESULTS || (entryState?.state
      ?.toLowerCase()
      .includes("summary") && result)}
    <TripReport
      {result}
      {staticRoomContent}
      onComplete={() => {
        transitionToResultSummary(result)
      }}
    />
  {/if}

  {#if entryState?.state === TRIP_STATE.SUMMARY}
    <NormalResultSummary {result} {room} {staticRoomContent} />
  {/if}

  <!-- Result Summary: Rat Dead -->
  {#if entryState?.state === TRIP_STATE.SUMMARY_RAT_DEAD}
    <RatDeadResultSummary {result} {room} {staticRoomContent} />
  {/if}

  <!-- Error -->
  {#if entryState?.state === TRIP_STATE.ERROR}
    <div class="error">
      {entryState?.errorMessage}
    </div>
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
