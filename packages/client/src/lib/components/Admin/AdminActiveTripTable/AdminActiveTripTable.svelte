<script lang="ts">
  import * as sortFunctions from "$lib/components/Trip/TripListing/sortFunctions"
  import type { TripEvent, PendingTrip } from "$lib/components/Admin/types"
  import { derived } from "svelte/store"
  import { profitLoss } from "$lib/modules/state/stores"
  import { CURRENCY_SYMBOL } from "$lib/modules/ui/constants"
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

  const portfolioClass = derived([profitLoss], ([$profitLoss]) => {
    if ($profitLoss === 0) return "neutral"
    return $profitLoss > 0 ? "upText" : "downText"
  })

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
      <span class="profit-value {$portfolioClass}">
        {#if $profitLoss < 0}-{/if}{CURRENCY_SYMBOL}{Math.abs($profitLoss)}
      </span>
    </div>
  </div>
  <table class="admin-trip-table">
    <thead>
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
  }

  .admin-trip-table {
    width: 100%;
    table-layout: fixed;
    border-collapse: collapse;
  }

  .table-summary {
    padding: 10px;
    display: flex;
    justify-content: space-between;
    font-size: var(--font-size-normal);
    font-family: var(--special-font-stack);
  }

  .no-data {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    justify-self: center;
    align-self: center;
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
  }

  .cell-action {
    width: 100px;
    height: 100%;
    padding-right: 0;
  }

  .downText {
    color: red;
  }

  .upText {
    color: #78ee72;
  }

  // .profit-value {
  //   &.upText {
  //     color: black;
  //     background: #78ee72;
  //   }
  //   &.downText {
  //     color: black;
  //     background: red;
  //   }
  // }
</style>
