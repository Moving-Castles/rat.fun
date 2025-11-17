<script lang="ts">
  import { onMount, onDestroy } from "svelte"
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
  import { strings } from "$lib/modules/strings"
  import {
    player,
    playerTrips,
    playerNonDepletedTrips,
    playerDepletedTrips
  } from "$lib/modules/state/stores"
  import { busy } from "$lib/modules/action-manager/index.svelte"
  import { backgroundMusic } from "$lib/modules/sound/stores"
  import { playSound } from "$lib/modules/sound"
  import { staticContent } from "$lib/modules/content"
  import { calculateProfitLossForTrip } from "./helpers"
  import * as sortFunctions from "$lib/components/Trip/TripListing/sortFunctions"
  import {
    isPhone,
    phoneActiveAdminView,
    phoneAdminTripsSubView,
    phoneAdminProfitSubView
  } from "$lib/modules/ui/state.svelte"

  import {
    AdminEventLog,
    CreateTrip,
    AdminActiveTripTable,
    AdminPastTripTable,
    ProfitLossHistoryGraph,
    ProfitLossOverview,
    AdminUnlockModal
  } from "$lib/components/Admin"
  import { SmallButton } from "$lib/components/Shared"

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

  onMount(() => {
    backgroundMusic.stop()
    backgroundMusic.play({ category: "ratfunMusic", id: "admin", loop: true })

    // Reset admin view to home on entry
    phoneActiveAdminView.set("home")
    phoneAdminTripsSubView.set("active")
    phoneAdminProfitSubView.set("graph")

    // Defer graph data loading to avoid blocking initial render
    setTimeout(() => {
      shouldLoadGraphData = true
    }, 50)
  })

  onDestroy(() => {
    // Reset all admin views when leaving cashboard
    phoneActiveAdminView.set("home")
    phoneAdminTripsSubView.set("active")
    phoneAdminProfitSubView.set("graph")
  })

  // Track previous view to detect when switching away from trips/profit
  let previousView = $state<"home" | "trips" | "profit">("home")

  $effect(() => {
    const currentView = $phoneActiveAdminView

    // Reset trips sub-view when switching away from trips
    if (previousView === "trips" && currentView !== "trips") {
      phoneAdminTripsSubView.set("active")
    }

    // Reset profit sub-view when switching away from profit
    if (previousView === "profit" && currentView !== "profit") {
      phoneAdminProfitSubView.set("graph")
    }

    previousView = currentView
  })
</script>

<div class="admin-container">
  {#if $player && !$player.masterKey}
    <AdminUnlockModal />
  {/if}

  {#if $isPhone}
    <!-- Phone Navigation -->
    <div class="phone-nav">
      <div class="nav-button-wrapper">
        <SmallButton
          text={strings.home.toUpperCase()}
          onclick={() => phoneActiveAdminView.set("home")}
          disabled={$phoneActiveAdminView === "home"}
        />
      </div>
      <div class="nav-button-wrapper">
        <SmallButton
          text={strings.trips.toUpperCase()}
          onclick={() => phoneActiveAdminView.set("trips")}
          disabled={$phoneActiveAdminView === "trips"}
        />
      </div>
      <div class="nav-button-wrapper">
        <SmallButton
          text={strings.profit.toUpperCase()}
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
              text={strings.active.toUpperCase()}
              onclick={() => phoneAdminTripsSubView.set("active")}
              disabled={$phoneAdminTripsSubView === "active"}
            />
          </div>
          <div class="sub-nav-button-wrapper">
            <SmallButton
              text={strings.past.toUpperCase()}
              onclick={() => phoneAdminTripsSubView.set("past")}
              disabled={$phoneAdminTripsSubView === "past"}
            />
          </div>
        </div>
        {#if $phoneAdminTripsSubView === "active"}
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
              text={strings.graph.toUpperCase()}
              onclick={() => phoneAdminProfitSubView.set("graph")}
              disabled={$phoneAdminProfitSubView === "graph"}
            />
          </div>
          <div class="sub-nav-button-wrapper">
            <SmallButton
              text={strings.log.toUpperCase()}
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
          <AdminEventLog {graphData} />
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
        <div class="p-l-graph">
          <ProfitLossHistoryGraph {graphData} height={clientHeight} />
        </div>
      </div>
      <!-- Event log -->
      <div class="event-log-container">
        <AdminEventLog {graphData} />
      </div>
    </div>
    <!-- Bottom row -->
    <div class="admin-row bottom">
      <!-- Active trips -->
      <div class="active-trip-table-container">
        <AdminActiveTripTable
          {pendingTrip}
          tripList={activeTripsList}
          plots={allSparkPlots}
          bind:sortFunction={activeTripsSortFunction}
          bind:sortDirection={activeTripsSortDirection}
        />
      </div>
      <!-- Divider -->
      <div class="admin-divider warning-mute"></div>
      <!-- Past trips -->
      <div class="past-trip-table-container">
        <AdminPastTripTable
          tripList={pastTripsList}
          bind:sortFunction={pastTripsSortFunction}
          bind:sortDirection={pastTripsSortDirection}
        />
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
      }
    }

    .event-log-container {
      height: 100%;
      width: 320px;
    }

    .active-trip-table-container {
      width: calc(50% - 20px);
    }

    .past-trip-table-container {
      width: calc(50% - 20px);
    }

    .admin-divider {
      width: 50px;
    }
  }
</style>
