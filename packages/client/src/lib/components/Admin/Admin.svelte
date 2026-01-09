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
  import { SmallButton, SignedNumber, SlideToggle } from "$lib/components/Shared"

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
  let previousView = $state<"home" | "trips" | "profit" | "events">("home")
  // Track tablet view toggle (800px-1024px) between graph and log
  let tabletProfitView = $state<"graph" | "log">("graph")
  // Track keyboard navigation to prevent pointer interference
  let keyboardNavigating = $state(false)
  let keyboardNavTimeout: ReturnType<typeof setTimeout> | null = null
  // Track init selection interval for cleanup
  let initSelectionInterval: ReturnType<typeof setInterval> | null = null
  // Track loading state for initial event selection
  let isLoadingInitialEvent = $state(true)

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

  const commit = (index?: number) => {
    if (index) {
      $selectedEvent = index
    } else {
      $selectedEvent = $focusEvent
    }
  }

  const go = () => {
    const event = graphData[$selectedEvent]
    if (!event || event.eventType === TRIP_EVENT_TYPE.BASELINE) {
      return
    }
    const href = makeHref(event)
    if (href) {
      goto(href)
    }
  }

  const handleKeypress = (e: KeyboardEvent) => {
    // Don't intercept keyboard events when user is typing in an input
    const target = e.target as HTMLElement
    if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) {
      return
    }

    e.preventDefault()

    // Only handle keyboard events on main trip lab, not on nested trip view
    if (page.route?.id?.includes("/trip-lab/[tripId]")) return

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
    }, 50)

    // Poll for data availability and initialize selection to latest event
    initSelectionInterval = setInterval(() => {
      if ($player?.masterKey && shouldLoadGraphData && allVisitsData.length > 0) {
        const latestEvent = allVisitsData[0]
        selectedEvent.set(latestEvent.index)
        focusEvent.set(latestEvent.index)
        focusTrip.set(latestEvent.tripId)
        isLoadingInitialEvent = false
        if (initSelectionInterval) clearInterval(initSelectionInterval)
      }
    }, 100)

    // Clean up interval after 5 seconds max
    setTimeout(() => {
      if (initSelectionInterval) clearInterval(initSelectionInterval)
      isLoadingInitialEvent = false
    }, 5000)
  })

  onDestroy(() => {
    // Clear any pending timers
    if (keyboardNavTimeout) clearTimeout(keyboardNavTimeout)
    if (initSelectionInterval) clearInterval(initSelectionInterval)
    // Reset all admin views when leaving trip lab
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
    <div class="phone-nav-toggle">
      <SlideToggle
        options={[
          { value: "home", label: UI_STRINGS.home.toUpperCase() },
          { value: "trips", label: UI_STRINGS.trips.toUpperCase() },
          { value: "profit", label: UI_STRINGS.profit.toUpperCase() }
          // { value: "events", label: UI_STRINGS.events.toUpperCase() }
        ]}
        value={$phoneActiveAdminView}
        onchange={v => phoneActiveAdminView.set(v as "home" | "trips" | "profit" | "events")}
      />
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
        <div class="phone-sub-toggle">
          <SlideToggle
            options={[
              { value: "active", label: UI_STRINGS.active.toUpperCase() },
              { value: "past", label: UI_STRINGS.past.toUpperCase() }
            ]}
            secondary={true}
            value={$adminTripsSubView}
            onchange={v => adminTripsSubView.set(v as "active" | "past")}
          />
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
        <div class="phone-sub-toggle">
          <SlideToggle
            options={[
              { value: "graph", label: UI_STRINGS.graph.toUpperCase() },
              { value: "log", label: UI_STRINGS.log.toUpperCase() }
            ]}
            secondary={true}
            value={$phoneAdminProfitSubView}
            onchange={v => phoneAdminProfitSubView.set(v as "graph" | "log")}
          />
        </div>
        {#if $phoneAdminProfitSubView === "graph"}
          <div class="phone-view-profit-loss-graph" bind:clientHeight>
            <ProfitLossHistoryGraph {graphData} height={clientHeight} />
          </div>
        {:else}
          <div class="phone-view-log">
            <AdminEventLog
              graphData={logData}
              {keyboardNavigating}
              onSelectionChange={handleEventLogSelection}
            />
          </div>
        {/if}
      </div>
    {:else if $phoneActiveAdminView === "events"}
      <div class="phone-view phone-view-events">
        {#key effectiveEvent?.meta?._id}
          <AdminTripEventTicker
            next={() => next(true, false)}
            nextEnabled={$selectedEvent > 0}
            previous={() => previous(true, false)}
            previousEnabled={$selectedEvent < graphData.length - 1}
            event={effectiveEvent}
          />
        {/key}

        {#if effectiveEvent && (effectiveEvent.eventType === "trip_visit" || effectiveEvent.eventType === "trip_death")}
          {#key effectiveEvent?.meta?._id}
            <div class="phone-introspection-scroll">
              {#key effectiveEvent?.meta?._id}
                <AdminTripEventIntrospection event={effectiveEvent} />
              {/key}
            </div>

            <div class="phone-event-button-container">
              <SmallButton
                text={UI_STRINGS.toTrip.toUpperCase() + effectiveEvent.meta.tripIndex}
                onclick={() => {
                  go()
                }}
              />
            </div>
          {/key}
        {:else}
          <div class="ticker-placeholder"></div>
          <div class="phone-introspection-scroll">
            <p class="empty-message">{isLoadingInitialEvent ? "LOADING..." : "NO EVENTS"}</p>
          </div>
          <div class="phone-event-button-container"></div>
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
            >
            <div class="toggle-divider">/</div>
            <button
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
        {#key effectiveEvent?.meta?._id}
          <AdminTripEventTicker
            next={() => next(true, page.route.id?.includes("[tripId]"))}
            nextEnabled={$selectedEvent > 0}
            previous={() => previous(true, page.route.id?.includes("[tripId]"))}
            previousEnabled={$selectedEvent < graphData.length - 1}
            event={effectiveEvent}
          />
        {/key}
        {#if effectiveEvent && (effectiveEvent.eventType === "trip_visit" || effectiveEvent.eventType === "trip_death")}
          {#key effectiveEvent?.meta?._id}
            <div class="full">
              {#key effectiveEvent?.meta?._id}
                <AdminTripEventIntrospection event={effectiveEvent} />
              {/key}
            </div>

            <SmallButton
              text={UI_STRINGS.toTrip.toUpperCase() + effectiveEvent.meta.tripIndex}
              onclick={() => {
                go()
              }}
            />
          {/key}
        {:else}
          <div class="full big-row">
            <p class="empty-message">{isLoadingInitialEvent ? "LOADING..." : "NO EVENTS"}</p>
          </div>
        {/if}
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
      height: calc(var(--game-window-height) - var(--top-bar-total-height-phone) - 2px);
    }

    .phone-nav-toggle {
      height: var(--phone-slide-toggle-height);
      flex-shrink: 0;
    }

    .phone-sub-toggle {
      height: var(--phone-secondary-slide-toggle-height);
      flex-shrink: 0;
    }

    .phone-view {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow-y: auto;
      overflow-x: hidden;
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
        background: var(--color-grey-darker);
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
      grid-template-rows: 40px 1fr 60px;
    }

    .ticker-placeholder {
      height: 40px;
      border-bottom: 1px solid var(--color-grey-dark);
      border-top: 1px solid var(--color-grey-dark);
    }

    .empty-message {
      filter: drop-shadow(0px 0px 2px var(--foreground));
      opacity: 0.5;
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100%;
      margin: 0;
      grid-row: 2 / 4;
    }

    .admin-divider {
      width: 50px;
      background: repeating-linear-gradient(
        45deg,
        var(--background),
        var(--background) 20px,
        var(--color-grey-dark) 20px,
        var(--color-grey-dark) 40px
      );
      opacity: 0.8;
      border-right: 1px solid var(--color-grey-dark);
      border-left: 1px solid var(--color-grey-dark);
    }

    .table-summary {
      height: 40px;
      padding: 10px;
      display: flex;
      justify-content: space-between;
      font-size: var(--font-size-normal);
      font-family: var(--special-font-stack);
      background: var(--background);
      color: var(--foreground);
      cursor: pointer;
      user-select: none;
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
      color: var(--foreground);

      &:hover {
        text-decoration: underline;
      }
    }
  }

  .full {
    height: 100%;
    overflow-y: scroll;
  }

  .big-row {
    grid-row: 2 / 4;
  }

  .phone-view-profit-loss-graph {
    height: 100%;
    background: var(--color-grey-darker);
  }

  .phone-view-log {
    flex: 1;
    min-height: 0;
    overflow: hidden;
  }

  .phone-view-events {
    display: grid;
    grid-template-rows: 40px 1fr 60px;
    gap: 0;
  }

  .phone-introspection-scroll {
    overflow-y: auto;
    height: 100%;
  }

  .phone-event-button-container {
    max-height: 80px;
    height: 100%;
    padding: 10px;
  }

  .toggle-divider {
    color: var(--foreground);
  }
</style>
