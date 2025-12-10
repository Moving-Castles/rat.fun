<script lang="ts">
  import type { Hex } from "viem"
  import type { Outcome } from "@sanity-types"
  import type { Trip as SanityTrip } from "@sanity-types"
  import { TRIP_EVENT_TYPE } from "$lib/components/Admin/enums"
  import type { TripEvent } from "$lib/components/Admin/types"
  import { UI_STRINGS } from "$lib/modules/ui/ui-strings/index.svelte"
  import { onMount } from "svelte"
  import { staticContent } from "$lib/modules/content"
  import { page } from "$app/state"
  import { goto } from "$app/navigation"
  import { selectedEvent, focusEvent, focusTrip, isPhone } from "$lib/modules/ui/state.svelte"
  import { playerTrips } from "$lib/modules/state/stores"
  import { mapLocalIndexToGlobal } from "$lib/components/Admin/helpers"

  import AdminTripPreviewHeader from "$lib/components/Admin/AdminTripPreview/AdminTripPreviewHeader.svelte"
  import AdminTripEventIntrospection from "$lib/components/Admin/AdminTripEventIntrospection/AdminTripEventIntrospection.svelte"
  import TripProfitLossGraph from "$lib/components/Admin/AdminTripPreview/TripProfitLossGraph/TripProfitLossGraph.svelte"
  import TripConfirmLiquidation from "$lib/components/Admin/AdminTripPreview/TripConfirmLiquidation/TripConfirmLiquidation.svelte"
  import LiquidateTrip from "$lib/components/Admin/AdminTripPreview/LiquidateTrip.svelte"
  import AdminEventLog from "$lib/components/Admin/AdminEventLog/AdminEventLog.svelte"
  import AddTripBalanceModal from "$lib/components/Admin/AdminTripPreview/AddTripBalanceModal/AddTripBalanceModal.svelte"

  import { BackButton, SlideToggle } from "$lib/components/Shared"

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

  // Phone sub-view toggle
  let phoneTripView = $state<"graph" | "log">("graph")

  // Add balance modal state
  let showAddBalanceModal = $state(false)

  // Track keyboard navigation to prevent pointer interference
  let keyboardNavigating = $state(false)
  let keyboardNavTimeout: ReturnType<typeof setTimeout> | null = null

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
    goto("/trips-lab")
  }

  const commit = () => {
    // Commit selection
    localSelectedEvent = localFocusEvent
    $selectedEvent = mapLocalIndexToGlobal(localFocusEvent, graphData, $playerTrips, $staticContent)
    $focusEvent = $selectedEvent
  }

  // Keyboard navigation for this trip's events
  const handleKeypress = (e: KeyboardEvent) => {
    // Skip if modal is open or not an arrow key
    if (showAddBalanceModal) return
    if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)) return

    e.preventDefault()

    if (!allVisitsData.length) return

    const currentVisitIndex = allVisitsData.findIndex(visit => visit.index === localFocusEvent)

    if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      keyboardNavigating = true
      if (keyboardNavTimeout) clearTimeout(keyboardNavTimeout)
      keyboardNavTimeout = setTimeout(() => {
        keyboardNavigating = false
      }, 400)
      // Move down in visual list (which is previous in reversed array)
      const prevIndex = currentVisitIndex === -1 ? allVisitsData.length - 1 : currentVisitIndex - 1
      if (prevIndex >= 0) {
        const prevEvent = allVisitsData[prevIndex]
        localFocusEvent = prevEvent.index
      }
      commit()
    } else if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      keyboardNavigating = true
      if (keyboardNavTimeout) clearTimeout(keyboardNavTimeout)
      keyboardNavTimeout = setTimeout(() => {
        keyboardNavigating = false
      }, 400)
      // Move up in visual list (which is next in reversed array)
      const nextIndex = currentVisitIndex === -1 ? 0 : currentVisitIndex + 1
      if (nextIndex < allVisitsData.length) {
        const nextEvent = allVisitsData[nextIndex]
        localFocusEvent = nextEvent.index
      }
      commit()
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
  {#if $isPhone}
    <!-- Phone Layout -->
    <div class="trip-inner-container phone">
      <div class="back-button-container full">
        <BackButton onclick={onBackButtonClick} />
      </div>
      <div class="full">
        <AdminTripPreviewHeader
          {sanityTripContent}
          {tripId}
          onAddBalance={() => (showAddBalanceModal = true)}
        />
      </div>
      <SlideToggle
        options={[
          { value: "graph", label: UI_STRINGS.graph.toUpperCase() },
          { value: "log", label: UI_STRINGS.log.toUpperCase() }
        ]}
        value={phoneTripView}
        onchange={v => (phoneTripView = v as "graph" | "log")}
      />
      {#if phoneTripView === "graph"}
        <div bind:clientHeight class="phone-view">
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
              $focusEvent = $selectedEvent
            }}
          />
        </div>
      {:else}
        <div class="phone-view">
          <AdminEventLog
            graphData={logData}
            hideUnlockEvent
            {keyboardNavigating}
            focusEventOverride={localFocusEvent}
            selectedEventOverride={localSelectedEvent}
            onFocusChange={(index, tripId) => {
              localFocusEvent = index
            }}
            onSelectionChange={(index, tripId) => {
              localSelectedEvent = index
              $selectedEvent = mapLocalIndexToGlobal(index, graphData, $playerTrips, $staticContent)
              $focusEvent = $selectedEvent
            }}
          />
        </div>
      {/if}
      <div class="full">
        {#if showLiquidateButton}
          <LiquidateTrip onclick={() => (liquidating = true)} {trip} />
        {:else if Number(trip.balance) === 0 && trip.liquidationBlock}
          <div class="depleted-liquidated">{UI_STRINGS.liquidated}</div>
        {:else if Number(trip.balance) === 0}
          <div class="depleted-liquidated">{UI_STRINGS.depleted}</div>
        {/if}
      </div>
    </div>
  {:else}
    <!-- Desktop Layout -->
    <div class="trip-inner-container" class:depleted={!showLiquidateButton}>
      <div class="back-button-container full">
        <BackButton onclick={onBackButtonClick} />
      </div>
      <div class="full">
        <AdminTripPreviewHeader
          {sanityTripContent}
          {tripId}
          onAddBalance={() => (showAddBalanceModal = true)}
        />
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
            $focusEvent = $selectedEvent
          }}
        />
      </div>
      <div bind:clientHeight class="right">
        <AdminEventLog
          graphData={logData}
          hideUnlockEvent
          {keyboardNavigating}
          focusEventOverride={localFocusEvent}
          selectedEventOverride={localSelectedEvent}
          onFocusChange={(index, tripId) => {
            localFocusEvent = index
          }}
          onSelectionChange={(index, tripId) => {
            localSelectedEvent = index
            $selectedEvent = mapLocalIndexToGlobal(index, graphData, $playerTrips, $staticContent)
            $focusEvent = $selectedEvent
          }}
        />
      </div>
      <div class="full">
        {#if showLiquidateButton}
          <LiquidateTrip onclick={() => (liquidating = true)} {trip} />
        {:else if Number(trip.balance) === 0 && trip.liquidationBlock}
          <div class="depleted-liquidated">{UI_STRINGS.liquidated}</div>
        {:else if Number(trip.balance) === 0}
          <div class="depleted-liquidated">{UI_STRINGS.depleted}</div>
        {/if}
      </div>
    </div>
  {/if}
{:else}
  <TripConfirmLiquidation
    {tripId}
    {trip}
    tripContent={sanityTripContent}
    onDone={async () => {
      await goto("/trips-lab")
      liquidating = false
    }}
    onAbort={() => {
      liquidating = false
    }}
  />
{/if}

{#if showAddBalanceModal}
  <AddTripBalanceModal {tripId} onclose={() => (showAddBalanceModal = false)} />
{/if}

<style lang="scss">
  .trip-inner-container {
    overflow-y: hidden;
    flex: 1;
    min-height: 0;
    height: 100%;
    max-height: 100%;
    overflow-x: hidden;

    &:not(.phone) {
      display: grid;
      grid-template-columns: repeat(12, 1fr);
      grid-template-rows: 60px 200px calc(var(--game-window-main-height) - 380px) 120px;
      grid-auto-rows: 1fr;

      .left {
        grid-column: 1 / 9;
      }
      .right {
        grid-column: 9 / 13;
      }

      .full {
        grid-column: 1 / 13;
      }
    }

    &.phone {
      display: flex;
      flex-direction: column;

      .full {
        flex-shrink: 0;
      }

      .phone-view {
        flex: 1;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        background: var(--color-grey-darker);
      }
    }

    .back-button-container {
      display: block;
      border-bottom: 1px solid var(--color-grey-mid);
      height: 60px;
      top: 0;
      z-index: var(--z-base);
    }
  }

  .depleted-liquidated {
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    background: var(--color-bad);
    color: var(--background);
    text-transform: uppercase;
    font-family: var(--special-font-stack);
    font-size: var(--font-size-large);
  }
</style>
