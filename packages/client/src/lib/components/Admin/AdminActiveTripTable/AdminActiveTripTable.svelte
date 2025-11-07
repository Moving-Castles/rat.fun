<script lang="ts">
  import * as sortFunctions from "$lib/components/Trip/TripListing/sortFunctions"
  import { SignedNumber } from "$lib/components/Shared"
  import type { TripEvent, PendingTrip } from "$lib/components/Admin/types"
  import { profitLoss } from "$lib/modules/state/stores"
  import { focusEvent, focusTrip } from "$lib/modules/ui/state.svelte"

  import AdminActiveTripTableItem from "./AdminActiveTripTableItem.svelte"
  import AdminPendingTripTableItem from "./AdminPendingTripTableItem.svelte"

  let {
    pendingTrip,
    tripList,
    plots,
    sortFunction = $bindable(),
    sortDirection = $bindable()
  }: {
    pendingTrip: PendingTrip
    tripList: [string, Trip][]
    plots: Record<string, TripEvent[]>
    sortFunction: (a: [string, Trip], b: [string, Trip]) => number
    sortDirection: "asc" | "desc"
  } = $props()

  let sortFunctionName = $derived(sortFunction.name)

  const sortByVisit = () => {
    sortFunction =
      sortDirection === "asc" ? sortFunctions.entriesByVisit : sortFunctions.entriesByVisitDesc
    sortDirection = sortDirection === "asc" ? "desc" : "asc"
  }

  const sortByProfit = () => {
    sortFunction =
      sortDirection === "asc" ? sortFunctions.entriesByProfit : sortFunctions.entriesByProfitDesc
    sortDirection = sortDirection === "asc" ? "desc" : "asc"
  }
</script>

<div class="admin-trip-table-container">
  <div class="table-summary">
    <div class="left">Active trips</div>
    <div class="right">
      Profit:
      <SignedNumber withCurrency withTween value={$profitLoss} />
    </div>
  </div>
  <table class="admin-trip-table">
    <thead class="trip-table-header">
      <tr>
        <!-- Index -->
        <th class="cell-index">#</th>
        <!-- Prompt -->
        <th class="cell-prompt">Trip</th>
        <!-- Visits -->
        <th class="cell-visits" onclick={sortByVisit}>
          {#if sortFunctionName === "entriesByVisit"}▼{:else if sortFunctionName === "entriesByVisitDesc"}▲{/if}&nbsp;Visits
        </th>
        <!-- Kills -->
        <th class="cell-kills">Kills</th>
        <!-- Balance -->
        <th class="cell-balance">Balance</th>
        <!-- Profit -->
        <th class="cell-profit" onclick={sortByProfit}>
          {#if sortFunctionName === "entriesByProfit"}▼{:else if sortFunctionName === "entriesByProfitDesc"}▲{/if}&nbsp;Profit
        </th>
        <!-- Spark -->
        <th class="cell-spark"></th>
        <!-- Action -->
        <th class="cell-action">Action</th>
      </tr>
    </thead>
    <tbody>
      <!-- Loading row for pending trip creation -->
      {#if pendingTrip && !tripList.map(r => r[1].prompt).includes(pendingTrip.prompt)}
        <AdminPendingTripTableItem {pendingTrip} />
      {/if}
      <!-- --- -->
      {#each tripList as tripEntry (tripEntry[0])}
        <AdminActiveTripTableItem
          id={tripEntry[0]}
          data={plots[tripEntry[0]]}
          trip={tripEntry[1]}
          onpointerenter={() => {
            $focusEvent = -1
            $focusTrip = tripEntry[0]
          }}
          onpointerleave={() => {
            $focusEvent = -1
            $focusTrip = ""
          }}
        />
      {/each}
    </tbody>
  </table>
</div>

<style lang="scss">
  .admin-trip-table-container {
    width: 100%;
    background: black;
    height: 100%;
    overflow-y: scroll;
    position: relative;
    user-select: none;
  }

  .admin-trip-table {
    width: 100%;
    table-layout: fixed;
    border-collapse: collapse;
    position: relative;

    th {
      position: sticky;
      top: 0;
      background: black;
    }
  }

  .table-summary {
    padding: 10px;
    display: flex;
    justify-content: space-between;
    font-size: var(--font-size-normal);
    font-family: var(--special-font-stack);
    // position: sticky;
    // top: 0;
    // background: #000;
  }

  th {
    font-size: var(--font-size-small);
    border-top: 1px solid rgb(59, 59, 59);
    border-bottom: 1px solid rgb(59, 59, 59);
    border-right: 1px dashed rgb(59, 59, 59);
    height: 24px;
    padding-right: 1ch;
  }

  .cell-index {
    width: 40px;
    text-align: center;
    padding-right: 1ch;
  }

  .cell-prompt {
    padding: 0 6px;
    text-align: left;
  }

  .cell-visits {
    text-align: right;
    width: 60px;
  }

  .cell-kills {
    text-align: right;
    width: 60px;
  }

  .cell-balance {
    width: 120px;
    text-align: right;
    width: 80px;
  }

  .cell-profit {
    width: 120px;
    text-align: right;
    width: 60px;
  }

  .cell-spark {
    width: 80px;

    @media (max-width: 800px) {
      display: none;
    }
  }

  .cell-action {
    width: 100px;
    height: 100%;
    padding-right: 0;

    @media (max-width: 800px) {
      width: 150px;
    }
  }
</style>
