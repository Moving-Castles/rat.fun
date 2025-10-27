<script lang="ts">
  import { onMount } from "svelte"
  import type { TripEventBaseline, TripEvent, PendingTrip } from "$lib/components/Admin/types"
  import { TRIP_EVENT_TYPE } from "$lib/components/Admin/enums"

  import {
    playerTrips,
    playerNonDepletedTrips,
    playerDepletedTrips
  } from "$lib/modules/state/stores"
  import { focusEvent } from "$lib/modules/ui/state.svelte"
  import { getModalState } from "$lib/components/Shared/Modal/state.svelte"
  import { backgroundMusic } from "$lib/modules/sound/stores"
  import { playSound } from "$lib/modules/sound"
  import { staticContent } from "$lib/modules/content"
  import { calculateProfitLossForTrip } from "./helpers"
  import * as sortFunctions from "$lib/components/Trip/TripListing/sortFunctions"

  import AdminEventLog from "$lib/components/Admin/AdminEventLog/AdminEventLog.svelte"
  import CreateTrip from "$lib/components/Admin/CreateTrip/CreateTrip.svelte"
  import AdminActiveTripTable from "$lib/components/Admin/AdminActiveTripTable/AdminActiveTripTable.svelte"
  import AdminPastTripTable from "$lib/components/Admin/AdminPastTripTable/AdminPastTripTable.svelte"
  import ProfitLossHistoryGraph from "$lib/components/Admin/ProfitLossHistoryGraph/ProfitLossHistoryGraph.svelte"
  import ProfitLossOverview from "$lib/components/Admin/ProfitLossOverview/ProfitLossOverview.svelte"

  let { modal } = getModalState()

  let focus = $state("")
  let pendingTrip = $state<PendingTrip>(null)
  let clientHeight = $state(0)

  // Sorting state for active trips
  let activeTripsSortDirection = $state<"asc" | "desc">("asc")
  let activeTripsSortFunction = $state(sortFunctions.entriesChronologically)

  // Sorting state for past trips
  let pastTripsSortDirection = $state<"asc" | "desc">("asc")
  let pastTripsSortFunction = $state(sortFunctions.entriesChronologically)

  // Calculate plot data for all trips
  let allSparkPlots = $derived.by(() => {
    const plots: Record<string, TripEvent[]> = {}

    Object.entries($playerTrips).forEach(([tripId, trip]) => {
      const sanityTripContent = $staticContent?.trips?.find(r => r._id == tripId)
      if (!sanityTripContent) return

      const outcomes = $staticContent?.outcomes?.filter(o => o.tripId == tripId) || []
      const profitLoss = calculateProfitLossForTrip(trip, tripId, sanityTripContent, outcomes, true)

      // Accumulate the value changes and add index
      let runningBalance = 0
      plots[tripId] = profitLoss.map((point, index) => {
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
  let graphData = $derived.by(() => {
    const trips = Object.values($playerTrips)
    if (!trips.length) {
      // console.log("no trips", performance.now())
      return []
    }

    const combinedData: TripEvent[] = []

    trips.forEach(trip => {
      const tripId = Object.keys($playerTrips).find(key => $playerTrips[key] === trip) || ""
      const sanityTripContent = $staticContent?.trips?.find(r => r._id == tripId)

      if (!sanityTripContent) return

      const outcomes = $staticContent?.outcomes?.filter(o => o.tripId == tripId) || []
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

    // Return data now
    // console.log("trips", dataWithBaseline.length, performance.now())

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
    $backgroundMusic?.stop()
    $backgroundMusic = playSound("ratfunMusic", "admin", true)
  })
</script>

{#snippet createTripModal()}
  <CreateTrip
    onsubmit={(data: PendingTrip) => {
      modal.hide()
      // Set pending state
      pendingTrip = data
    }}
    ondone={() => {
      // Clear pending state with some delay, so it can be replaced in the list with style
      setTimeout(() => {
        pendingTrip = null
      }, 2000)
    }}
  />
{/snippet}

<div class="admin-container">
  <!-- Top row -->
  <div class="admin-row top">
    <!-- Trip monitor -->
    <div class="trip-monitor-container" bind:clientHeight>
      <div class="p-l-overview">
        <ProfitLossOverview
          onCreateTripClick={() => {
            modal.set(createTripModal)
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
</div>

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
      width: 40px;
    }
  }
</style>
