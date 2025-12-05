<script lang="ts">
  import { onMount, onDestroy } from "svelte"
  import * as sortFunctions from "$lib/components/Trip/TripListing/sortFunctions"
  import type {
    TripEventBaseline,
    TripEvent,
    TripEventCreation,
    TripEventLiquidation,
    TripEventDeath,
    TripEventVisit,
    PendingTrip
  } from "$lib/components/Admin/types"
  import { TRIP_EVENT_TYPE } from "$lib/components/Admin/enums"
  import { UI_STRINGS } from "$lib/modules/ui/ui-strings/index.svelte"
  import {
    player,
    playerTrips,
    playerNonDepletedTrips,
    playerDepletedTrips,
    realisedProfitLoss,
    profitLoss
  } from "$lib/modules/state/stores"
  import { busy } from "$lib/modules/action-manager/index.svelte"
  import { backgroundMusic } from "$lib/modules/sound/stores"
  import { staticContent } from "$lib/modules/content"
  import { calculateProfitLossForTrip } from "./helpers"
  import { page } from "$app/state"
  import {
    isPhone,
    phoneActiveAdminView,
    adminTripsSubView,
    phoneAdminProfitSubView,
    focusEvent,
    selectedEvent,
    focusTrip
  } from "$lib/modules/ui/state.svelte"
  import { goto } from "$app/navigation"

  import {
    AdminEventLog,
    CreateTrip,
    AdminActiveTripTable,
    AdminPastTripTable,
    ProfitLossHistoryGraph,
    ProfitLossOverview,
    AdminUnlockModal,
    AdminTripEventIntrospection,
    AdminTripEventTicker
  } from "$lib/components/Admin"
  import { makeHref } from "$lib/components/Admin/helpers"
  import { SmallButton, SignedNumber } from "$lib/components/Shared"
  import BigButton from "../Shared/Buttons/BigButton.svelte"

  let showCreateTripModal = $state(false)
  let savedTripDescription = $state<string>("")
  let savedFolderId = $state<string>("")
  let pendingTrip = $state<PendingTrip>(null)
  let clientHeight = $state(0)
  let shouldLoadGraphData = $state(false)
  // Sorting state for active trips
  let activeTripsSortDirection = $state<"asc" | "desc">("asc")
  let activeTripsSortFunction = $state(sortFunctions.entriesChronologically)
  // Sorting state for past trips
  let pastTripsSortDirection = $state<"asc" | "desc">("asc")
  let pastTripsSortFunction = $state(sortFunctions.entriesChronologically)
  // Track previous view to detect when switching away from trips/profit
  let previousView = $state<"home" | "trips" | "profit">("home")
  // Track tablet view toggle (800px-1024px) between graph and log
  let tabletProfitView = $state<"graph" | "log">("graph")
  // Track keyboard navigation to prevent pointer interference
  let keyboardNavigating = $state(false)
  let keyboardNavTimeout: ReturnType<typeof setTimeout> | null = null

  // Memoized lookups for static content to avoid repeated find/filter operations
  let tripContentMap = $derived(new Map($staticContent?.trips?.map(t => [t._id, t]) || []))

  let outcomesByTripId = $derived(
    ($staticContent?.outcomes || []).reduce(
      (acc, outcome) => {
        if (outcome.tripId) {
          if (!acc[outcome.tripId]) acc[outcome.tripId] = []
          acc[outcome.tripId].push(outcome)
        }
        return acc
      },
      {} as Record<string, typeof $staticContent.outcomes>
    )
  )

  // Calculate plot data for all trips
  let allSparkPlots = $derived.by(() => {
    const plots: Record<
      string,
      (TripEventCreation | TripEventLiquidation | TripEventDeath | TripEventVisit)[]
    > = {}

    Object.entries($playerTrips).forEach(([tripId, trip]) => {
      const sanityTripContent = tripContentMap.get(tripId)
      if (!sanityTripContent) return

      const outcomes = outcomesByTripId[tripId] || []
      const profitLoss = calculateProfitLossForTrip(trip, tripId, sanityTripContent, outcomes, true)

      // Accumulate the value changes and add index, filtering to only compatible event types
      let runningBalance = 0
      plots[tripId] = profitLoss
        .filter(
          (
            point
          ): point is TripEventCreation | TripEventLiquidation | TripEventDeath | TripEventVisit =>
            point.eventType === TRIP_EVENT_TYPE.CREATION ||
            point.eventType === TRIP_EVENT_TYPE.LIQUIDATION ||
            point.eventType === TRIP_EVENT_TYPE.DEATH ||
            point.eventType === TRIP_EVENT_TYPE.VISIT
        )
        .map((point, index) => {
          runningBalance += point.valueChange || 0
          return {
            ...point,
            index,
            value: runningBalance
          }
        })
    })

    return plots
  })

  // Sorted active trips
  let activeTripsList = $derived.by(() => {
    let entries = Object.entries($playerNonDepletedTrips)
    return entries.sort(activeTripsSortFunction)
  })

  // Sorted past trips
  let pastTripsList = $derived.by(() => {
    let entries = Object.entries($playerDepletedTrips)
    return entries.sort(pastTripsSortFunction)
  })

  // Data processing logic moved from ProfitLossHistoryGraph
  // Lazy load graph data to avoid blocking initial render
  let graphData = $derived.by(() => {
    if (!shouldLoadGraphData) {
      return []
    }

    const trips = Object.values($playerTrips)
    if (!trips.length) {
      return []
    }

    const combinedData: TripEvent[] = []

    trips.forEach(trip => {
      const tripId = Object.keys($playerTrips).find(key => $playerTrips[key] === trip) || ""
      const sanityTripContent = tripContentMap.get(tripId)

      if (!sanityTripContent) return

      const outcomes = outcomesByTripId[tripId] || []
      const profitLoss = calculateProfitLossForTrip(trip, tripId, sanityTripContent, outcomes)

      combinedData.push(...profitLoss)
    })

    // Sort by time
    combinedData.sort((a, b) => a.time - b.time)

    // Find the earliest time
    const earliestTime = combinedData.length > 0 ? combinedData[0].time : Date.now()

    // Add initial 0 point at the start
    const dataWithBaseline = [
      {
        eventType: TRIP_EVENT_TYPE.BASELINE,
        time: earliestTime - 1000, // 1 second before first event
        value: 0,
        valueChange: 0,
        tripId: "",
        tripCreationCost: 0
      } as TripEventBaseline,
      ...combinedData
    ]

    // Now accumulate the value changes globally and add index
    let runningBalance = 0

    return dataWithBaseline.map((point, index) => {
      runningBalance += point.valueChange || 0
      return {
        ...point,
        index,
        value: runningBalance
      }
    })
  })

  let logData = $derived(
    graphData?.toReversed().filter(p => p.eventType !== TRIP_EVENT_TYPE.BASELINE)
  )

  let allVisitsData = $derived(
    logData.filter(point => point.eventType === "trip_visit" || point.eventType === "trip_death")
  )

  const previous = (andCommit = false, andGo = false) => {
    const currentVisitIndex = allVisitsData.findIndex(visit => visit.index === $focusEvent)
    // Move down in visual list (which is previous in reversed array)
    const prevIndex = currentVisitIndex === -1 ? allVisitsData.length - 1 : currentVisitIndex - 1
    if (prevIndex >= 0) {
      const prevEvent = allVisitsData[prevIndex]
      $focusEvent = prevEvent.index
      $focusTrip = prevEvent.tripId
    }
    if (andCommit || andGo) {
      commit()
    }
    if (andGo) {
      go()
    }
  }

  const next = (andCommit = false, andGo = false) => {
    const currentVisitIndex = allVisitsData.findIndex(visit => visit.index === $focusEvent)
    // Move up in visual list (which is next in reversed array)
    const nextIndex = currentVisitIndex === -1 ? 0 : currentVisitIndex + 1
    if (nextIndex < allVisitsData.length) {
      const nextEvent = allVisitsData[nextIndex]
      $focusEvent = nextEvent.index
      $focusTrip = nextEvent.tripId
    }
    if (andCommit || andGo) {
      commit()
    }
    if (andGo) {
      go()
    }
  }

  const commit = () => {
    $selectedEvent = $focusEvent
  }

  const go = () => {
    const event = graphData[$focusEvent]
    if (!event || event.eventType === TRIP_EVENT_TYPE.BASELINE) {
      return
    }
    const href = makeHref(event)
    if (href) {
      goto(href)
    }
  }

  const handleKeypress = (e: KeyboardEvent) => {
    e.preventDefault()

    // Only handle keyboard events on main trips lab, not on nested trip view
    if (page.route?.id?.includes("/cashboard/[tripId]")) return

    if (!allVisitsData.length) return

    if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      keyboardNavigating = true
      if (keyboardNavTimeout) clearTimeout(keyboardNavTimeout)
      keyboardNavTimeout = setTimeout(() => {
        keyboardNavigating = false
      }, 400)
      previous()
      commit()
    } else if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      keyboardNavigating = true
      if (keyboardNavTimeout) clearTimeout(keyboardNavTimeout)
      keyboardNavTimeout = setTimeout(() => {
        keyboardNavigating = false
      }, 400)
      next()
      commit()
    } else if (e.key === "Return" || e.key === "Enter") {
      if ($selectedEvent === $focusEvent) {
        go()
      } else {
        commit()
        go()
      }
    }
  }

  let effectiveEvent = $derived(graphData?.[$selectedEvent])

  const handleEventLogSelection = (index: number, tripId: string) => {
    $selectedEvent = index
    // If user is viewing a trip detail page and clicks on the event log,
    // navigate back to main trips lab
    if (page.route?.id?.includes("/cashboard/[tripId]")) {
      goto("/cashboard")
    }
  }

  $effect(() => {
    const currentView = $phoneActiveAdminView

    // Reset trips sub-view when switching away from trips
    if (previousView === "trips" && currentView !== "trips") {
      adminTripsSubView.set("active")
    }

    // Reset profit sub-view when switching away from profit
    if (previousView === "profit" && currentView !== "profit") {
      phoneAdminProfitSubView.set("graph")
    }

    previousView = currentView
  })
  onMount(() => {
    backgroundMusic.stop()
    backgroundMusic.play({ category: "ratfunMusic", id: "admin", loop: true })

    // Reset admin view to home on entry
    phoneActiveAdminView.set("home")
    adminTripsSubView.set("active")
    phoneAdminProfitSubView.set("graph")
    tabletProfitView = "graph"

    // Defer graph data loading to avoid blocking initial render
    setTimeout(() => {
      shouldLoadGraphData = true

      // Initialize selectedEvent to first visit/death event after data loads
      setTimeout(() => {
        if (allVisitsData.length > 0) {
          const firstEvent = allVisitsData[0]
          selectedEvent.set(firstEvent.index)
        }
      }, 100)
    }, 50)
  })

  onDestroy(() => {
    // Reset all admin views when leaving trips lab
    phoneActiveAdminView.set("home")
    adminTripsSubView.set("active")
    phoneAdminProfitSubView.set("graph")
    tabletProfitView = "graph"
  })
</script>

<svelte:window onkeydown={handleKeypress} />

<div class="admin-container">
  {#if $player && !$player.masterKey}
    <AdminUnlockModal />
  {/if}

  {#if $isPhone}
    <!-- Phone Navigation -->
    <div class="phone-nav">
      <div class="nav-button-wrapper">
        <SmallButton
          text={UI_STRINGS.home.toUpperCase()}
          onclick={() => phoneActiveAdminView.set("home")}
          disabled={$phoneActiveAdminView === "home"}
        />
      </div>
      <div class="nav-button-wrapper">
        <SmallButton
          text={UI_STRINGS.trips.toUpperCase()}
          onclick={() => phoneActiveAdminView.set("trips")}
          disabled={$phoneActiveAdminView === "trips"}
        />
      </div>
      <div class="nav-button-wrapper">
        <SmallButton
          text={UI_STRINGS.profit.toUpperCase()}
          onclick={() => phoneActiveAdminView.set("profit")}
          disabled={$phoneActiveAdminView === "profit"}
        />
      </div>
    </div>

    <!-- Phone Views -->
    {#if $phoneActiveAdminView === "home"}
      <div class="phone-view">
        <ProfitLossOverview
          onCreateTripClick={() => {
            if (busy.CreateTrip.current !== 0) return
            showCreateTripModal = true
          }}
        />
      </div>
    {:else if $phoneActiveAdminView === "trips"}
      <div class="phone-view">
        <div class="phone-sub-nav">
          <div class="sub-nav-button-wrapper">
            <SmallButton
              text={UI_STRINGS.active.toUpperCase()}
              onclick={() => adminTripsSubView.set("active")}
              disabled={$adminTripsSubView === "active"}
            />
          </div>
          <div class="sub-nav-button-wrapper">
            <SmallButton
              text={UI_STRINGS.past.toUpperCase()}
              onclick={() => adminTripsSubView.set("past")}
              disabled={$adminTripsSubView === "past"}
            />
          </div>
        </div>
        {#if $adminTripsSubView === "active"}
          <AdminActiveTripTable
            {pendingTrip}
            tripList={activeTripsList}
            plots={allSparkPlots}
            bind:sortFunction={activeTripsSortFunction}
            bind:sortDirection={activeTripsSortDirection}
          />
        {:else}
          <AdminPastTripTable
            tripList={pastTripsList}
            bind:sortFunction={pastTripsSortFunction}
            bind:sortDirection={pastTripsSortDirection}
          />
        {/if}
      </div>
    {:else if $phoneActiveAdminView === "profit"}
      <div class="phone-view">
        <div class="phone-sub-nav">
          <div class="sub-nav-button-wrapper">
            <SmallButton
              text={UI_STRINGS.graph.toUpperCase()}
              onclick={() => phoneAdminProfitSubView.set("graph")}
              disabled={$phoneAdminProfitSubView === "graph"}
            />
          </div>
          <div class="sub-nav-button-wrapper">
            <SmallButton
              text={UI_STRINGS.log.toUpperCase()}
              onclick={() => phoneAdminProfitSubView.set("log")}
              disabled={$phoneAdminProfitSubView === "log"}
            />
          </div>
        </div>
        {#if $phoneAdminProfitSubView === "graph"}
          <div bind:clientHeight style="flex: 1; background: #222;">
            <ProfitLossHistoryGraph {graphData} height={clientHeight} />
          </div>
        {:else}
          <AdminEventLog
            graphData={logData}
            {keyboardNavigating}
            onSelectionChange={handleEventLogSelection}
          />
        {/if}
      </div>
    {/if}
  {:else}
    <!-- Desktop Layout -->
    <!-- Top row -->
    <div class="admin-row top">
      <!-- Trip monitor -->
      <div class="trip-monitor-container" bind:clientHeight>
        <div class="p-l-overview">
          <ProfitLossOverview
            onCreateTripClick={() => {
              if (busy.CreateTrip.current !== 0) return
              showCreateTripModal = true
            }}
          />
        </div>
        <div class="p-l-graph" class:tablet-hidden={tabletProfitView === "log"}>
          <ProfitLossHistoryGraph
            {graphData}
            height={clientHeight}
            onToggleToLog={() => (tabletProfitView = "log")}
          />
        </div>
      </div>
      <!-- Event log -->
      <div class="event-log-container" class:tablet-hidden={tabletProfitView === "graph"}>
        <AdminEventLog
          graphData={logData}
          {keyboardNavigating}
          onSelectionChange={handleEventLogSelection}
          onToggleToGraph={() => (tabletProfitView = "graph")}
        />
      </div>
    </div>
    <!-- Bottom row -->
    <div class="admin-row bottom">
      <!-- Active trips -->
      <div class="trip-table-container">
        <div class="table-summary">
          <div class="left">
            <button
              type="button"
              class="toggle"
              class:secondary={$adminTripsSubView === "past"}
              onclick={() => adminTripsSubView.set("active")}>{UI_STRINGS.activeTrips}</button
            ><button
              type="button"
              class="toggle"
              class:secondary={$adminTripsSubView === "active"}
              onclick={() => adminTripsSubView.set("past")}>{UI_STRINGS.pastTrips}</button
            >
          </div>
          <div class="right">
            {UI_STRINGS.profit}:
            {#if $adminTripsSubView === "active"}
              <SignedNumber withCurrency withTween value={$profitLoss} />
            {:else}
              <SignedNumber withCurrency value={$realisedProfitLoss} />
            {/if}
          </div>
        </div>
        {#if $adminTripsSubView === "active"}
          <AdminActiveTripTable
            {pendingTrip}
            tripList={activeTripsList}
            plots={allSparkPlots}
            bind:sortFunction={activeTripsSortFunction}
            bind:sortDirection={activeTripsSortDirection}
          />
        {:else}
          <AdminPastTripTable
            tripList={pastTripsList}
            bind:sortFunction={pastTripsSortFunction}
            bind:sortDirection={pastTripsSortDirection}
          />
        {/if}
      </div>
      <!-- Divider -->
      <div class="admin-divider warning-mute"></div>
      <!-- Past trips -->
      <div class="flashback-container">
        {#if effectiveEvent}
          {#key effectiveEvent?.meta?._id}
            <AdminTripEventTicker
              next={() => next(true, page.route.id?.includes("[tripId]"))}
              nextEnabled={$selectedEvent > 0}
              previous={() => previous(true, page.route.id?.includes("[tripId]"))}
              previousEnabled={$selectedEvent < graphData.length - 1}
              event={effectiveEvent}
            />
          {/key}
        {/if}

        <div class="full">
          {#key effectiveEvent?.meta?._id}
            <AdminTripEventIntrospection event={effectiveEvent} />
          {/key}
        </div>

        {#if effectiveEvent?.eventType === TRIP_EVENT_TYPE.DEATH || effectiveEvent?.eventType === TRIP_EVENT_TYPE.VISIT}
          <button class="small-button" onclick={go}
            >{UI_STRINGS.toTrip.toUpperCase()}{effectiveEvent.meta.tripIndex}</button
          >
        {/if}
        <!-- Show flashback here for the LAST OPENED OUTCOME -->
      </div>
    </div>
  {/if}
</div>

{#if showCreateTripModal}
  <CreateTrip
    {savedTripDescription}
    {savedFolderId}
    onclose={(currentDescription: string, currentFolderId: string) => {
      showCreateTripModal = false
      savedTripDescription = currentDescription
      savedFolderId = currentFolderId
    }}
    onsubmit={(data: PendingTrip) => {
      showCreateTripModal = false
      savedTripDescription = ""
      savedFolderId = ""
      pendingTrip = data
    }}
    ondone={() => {
      setTimeout(() => {
        pendingTrip = null
      }, 2000)
    }}
  />
{/if}

<style lang="scss">
  .admin-container {
    position: relative;
    overflow-x: hidden;
    overflow-y: hidden;
    height: var(--game-window-main-height);
    width: var(--game-window-width);
    background-image: url("/images/texture-5.png");
    background-size: 200px;

    display: flex;
    flex-direction: column;
    flex-wrap: nowrap;

    @media (max-width: 800px) {
      width: 100%;
    }

    .phone-nav {
      display: flex;
      border-bottom: var(--default-border-style);
      background: var(--background-semi-transparent);
      flex-shrink: 0;

      .nav-button-wrapper {
        flex: 0 0 33.333%;
        width: 33.333%;
        height: 60px;

        :global(button) {
          border-radius: 0;
        }
      }
    }

    .phone-sub-nav {
      display: flex;
      border-bottom: var(--default-border-style);
      background: var(--background-semi-transparent);
      flex-shrink: 0;

      .sub-nav-button-wrapper {
        flex: 0 0 50%;
        width: 50%;
        height: 50px;

        :global(button) {
          border-radius: 0;
        }
      }
    }

    .phone-view {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .admin-row {
      height: 50%;
      display: flex;
      flex-direction: row;
      flex-wrap: nowrap;
    }

    .trip-monitor-container {
      width: calc(100% - 300px);
      height: 100%;
      display: flex;
      justify-content: flex-start;
      align-items: center;

      @media (min-width: 801px) and (max-width: 1024px) {
        width: 100%;
      }

      .p-l-overview {
        min-width: 460px;
        width: 460px;
        height: 100%;
      }

      .p-l-graph {
        height: 100%;
        width: 100%;
        background: #222;
        text-align: center;
        display: flex;
        justify-content: center;
        align-items: center;

        @media (min-width: 801px) and (max-width: 1024px) {
          &.tablet-hidden {
            display: none;
          }
        }
      }
    }

    .event-log-container {
      height: 100%;
      width: 320px;

      @media (min-width: 801px) and (max-width: 1024px) {
        width: 100%;

        &.tablet-hidden {
          display: none;
        }
      }
    }

    .trip-table-container {
      width: calc(50% - 20px);
    }

    .flashback-container {
      width: calc(50% - 20px);
      display: grid;
      height: 100%;
      grid-template-rows: 30px 1fr 60px;
    }

    .admin-divider {
      width: 50px;
    }

    .table-summary {
      padding: 10px;
      display: flex;
      justify-content: space-between;
      font-size: var(--font-size-normal);
      font-family: var(--special-font-stack);
      cursor: pointer;
    }
  }

  .secondary {
    opacity: 0.6;
  }

  .left {
    display: flex;
    gap: 0.5rem;

    .toggle {
      background: none;
      border: none;
      padding: 0;
      font: inherit;
      cursor: pointer;

      &:hover {
        text-decoration: underline;
      }
    }
  }

  .small-button {
    height: 100%;
    background: var(--color-alert-priority);
    width: 100%;
    border: none;
    display: block;
    border-width: 10px;
    border-style: inset;
    border-color: rgba(0, 0, 0, 0.3);

    &:hover {
      background: var(--color-alert-priority-light);
    }

    &:active {
      background: var(--color-alert-priority-muted);
      border-style: inset;
      transform: translateY(2px);
      border-width: 10px;
      position: relative;
      top: -2px;
    }
  }

  .full {
    height: 100%;
    overflow-y: scroll;
  }
</style>
