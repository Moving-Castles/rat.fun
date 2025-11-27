<script lang="ts">
  import type { Hex } from "viem"
  import type { Outcome } from "@sanity-types"
  import type { Trip as SanityTrip } from "@sanity-types"
  import { TRIP_EVENT_TYPE } from "$lib/components/Admin/enums"
  import type { TripEvent } from "$lib/components/Admin/types"
  import { onMount } from "svelte"
  import { staticContent } from "$lib/modules/content"
  import { page } from "$app/state"
  import { goto } from "$app/navigation"
  import { selectedEvent, focusEvent, focusTrip } from "$lib/modules/ui/state.svelte"
  import { playerTrips } from "$lib/modules/state/stores"
  import { mapLocalIndexToGlobal } from "$lib/components/Admin/helpers"

  import AdminTripPreviewHeader from "$lib/components/Admin/AdminTripPreview/AdminTripPreviewHeader.svelte"
  import AdminTripEventIntrospection from "$lib/components/Admin/AdminTripEventIntrospection/AdminTripEventIntrospection.svelte"
  import TripProfitLossGraph from "$lib/components/Admin/AdminTripPreview/TripProfitLossGraph/TripProfitLossGraph.svelte"
  import TripConfirmLiquidation from "$lib/components/Admin/AdminTripPreview/TripConfirmLiquidation/TripConfirmLiquidation.svelte"
  import LiquidateTrip from "$lib/components/Admin/AdminTripPreview/LiquidateTrip.svelte"
  import AdminEventLog from "$lib/components/Admin/AdminEventLog/AdminEventLog.svelte"

  import { BackButton } from "$lib/components/Shared"

  let {
    tripId,
    trip,
    liquidating,
    sanityTripContent
  }: { tripId: Hex; trip: Trip; liquidating?: boolean; sanityTripContent: SanityTrip } = $props()

  let tripOutcomes = $state<Outcome[]>()

  let clientHeight = $state(500)

  // graphData is bound to the data prop of TripProfitLossGraph
  let graphData = $state<TripEvent[]>([])

  // Local state for this trip's preview/selection (separate from parent layout)
  let localFocusEvent = $state(-1)
  let localSelectedEvent = $state(-1)

  // Show liquidate button if:
  //  * - Trip is not depleted
  let showLiquidateButton = $derived(trip.balance > 0)

  let event = $derived(graphData[localSelectedEvent])

  let logData = $derived(
    graphData?.toReversed().filter(p => p.eventType !== TRIP_EVENT_TYPE.BASELINE)
  )

  // Get only visit/death events for keyboard navigation (reversed to match display order)
  let allVisitsData = $derived(
    logData.filter(point => point.eventType === "trip_visit" || point.eventType === "trip_death")
  )

  const onBackButtonClick = () => {
    goto("/cashboard")
  }

  // Keyboard navigation for this trip's events
  const handleKeypress = (e: KeyboardEvent) => {
    if (!allVisitsData.length) return

    const currentVisitIndex = allVisitsData.findIndex(visit => visit.index === localFocusEvent)

    if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      // Move down in visual list (which is previous in reversed array)
      const prevIndex = currentVisitIndex === -1 ? allVisitsData.length - 1 : currentVisitIndex - 1
      if (prevIndex >= 0) {
        const prevEvent = allVisitsData[prevIndex]
        localFocusEvent = prevEvent.index
      }
    } else if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      // Move up in visual list (which is next in reversed array)
      const nextIndex = currentVisitIndex === -1 ? 0 : currentVisitIndex + 1
      if (nextIndex < allVisitsData.length) {
        const nextEvent = allVisitsData[nextIndex]
        localFocusEvent = nextEvent.index
      }
    } else if (e.key === "Return" || e.key === "Enter") {
      // Commit selection
      localSelectedEvent = localFocusEvent
      $selectedEvent = mapLocalIndexToGlobal(
        localFocusEvent,
        graphData,
        $playerTrips,
        $staticContent
      )
      // Clear parent's hover state so scroll goes to selected, not hovered
      $focusEvent = -1
      $focusTrip = ""
    }
  }

  // Effect to set focus event from URL params whenever they change
  $effect(() => {
    if (graphData.length > 0) {
      const getEventIndexFromId = (id: string) => {
        const index = graphData.findIndex(p => p?.meta?._id === id)
        return index
      }

      // React to URL param changes
      const focusId = page.url.searchParams.get("focusId")
      const focusEventParam = page.url.searchParams.get("focusEvent")

      let eventIndex = -1
      if (focusId) {
        eventIndex = getEventIndexFromId(focusId)
      } else if (focusEventParam) {
        eventIndex = Number(focusEventParam)
      }

      localFocusEvent = eventIndex
      localSelectedEvent = eventIndex
    }
  })

  onMount(() => {
    const outcomes = $staticContent?.outcomes?.filter(o => o.tripId == tripId) || []

    // Sort the outcomes in order of creation
    tripOutcomes = outcomes.sort((a, b) => {
      return new Date(a._createdAt).getTime() - new Date(b._createdAt).getTime()
    })
  })
</script>

<svelte:window onkeydown={handleKeypress} />

{#if !liquidating}
  <div class="trip-inner-container" class:depleted={!showLiquidateButton}>
    <div class="back-button-container full">
      <BackButton onclick={onBackButtonClick} />
    </div>
    <div class="full">
      <AdminTripPreviewHeader {sanityTripContent} {trip} />
    </div>
    <div class="left">
      <TripProfitLossGraph
        behavior="click"
        {trip}
        {tripId}
        bind:data={graphData}
        height={clientHeight}
        focusEventOverride={localFocusEvent}
        selectedEventOverride={localSelectedEvent}
        onFocusChange={index => {
          localFocusEvent = index
        }}
        onSelectionChange={index => {
          localSelectedEvent = index
          $selectedEvent = mapLocalIndexToGlobal(index, graphData, $playerTrips, $staticContent)
          // Clear parent's hover state so scroll goes to selected, not hovered
          $focusEvent = -1
          $focusTrip = ""
        }}
      />
    </div>
    <div bind:clientHeight class="right">
      <AdminEventLog
        graphData={logData}
        behavior="click"
        hideUnlockEvent
        focusEventOverride={localFocusEvent}
        selectedEventOverride={localSelectedEvent}
        onFocusChange={(index, tripId) => {
          localFocusEvent = index
        }}
        onSelectionChange={(index, tripId) => {
          localSelectedEvent = index
          $selectedEvent = mapLocalIndexToGlobal(index, graphData, $playerTrips, $staticContent)
          // Clear parent's hover state so scroll goes to selected, not hovered
          $focusEvent = -1
          $focusTrip = ""
        }}
      />
    </div>
    {#if showLiquidateButton}
      <div class="full">
        <LiquidateTrip onclick={() => (liquidating = true)} {trip} />
      </div>
    {/if}
  </div>
{:else}
  <TripConfirmLiquidation
    {tripId}
    {trip}
    tripContent={sanityTripContent}
    onDone={async () => {
      await goto("/cashboard")
      liquidating = false
    }}
    onAbort={() => {
      liquidating = false
    }}
  />
{/if}

<style lang="scss">
  .trip-inner-container {
    overflow-y: hidden;
    flex: 1;
    min-height: 0;
    height: 100%;
    max-height: 100%;
    overflow-x: hidden;
    display: grid;
    grid-template-columns: repeat(12, 1fr);
    grid-template-rows: 60px 200px calc(var(--game-window-main-height) - 340px) auto;
    grid-auto-rows: 1fr;

    .section-header {
      padding: 0 8px;
    }

    .left {
      grid-column: 1 / 9;
    }
    .right {
      grid-column: 9 / 13;
    }

    .full {
      grid-column: 1 / 13;
    }
    .back-button-container {
      display: block;
      border-bottom: 1px solid var(--color-grey-mid);
      height: 60px;
      top: 0;
      z-index: var(--z-base);
    }
  }
</style>
