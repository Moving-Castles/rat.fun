<script lang="ts">
  import type { PlotPoint, PendingTrip } from "$lib/components/Admin/types"
  import { derived } from "svelte/store"
  import { playerActiveTrips, profitLoss } from "$lib/modules/state/stores"
  import {
    entriesChronologically,
    entriesChronologicallyDesc,
    entriesByProfit,
    entriesByProfitDesc,
    entriesByVisit,
    entriesByVisitDesc
  } from "$lib/components/Trip/TripListing/sortFunctions"
  import { staticContent } from "$lib/modules/content"
  import { CURRENCY_SYMBOL } from "$lib/modules/ui/constants"

  import AdminActiveTripTableItem from "./AdminActiveTripTableItem.svelte"
  import AdminPendingTripTableItem from "./AdminPendingTripTableItem.svelte"

  import { createPlotsFromTripList } from "../helpers"

  let { focus = $bindable(), pendingTrip }: { focus: string; pendingTrip: PendingTrip } = $props()

  let sortDirection = $state<"asc" | "desc">("asc")

  let sortFunction = $state(
    sortDirection === "asc" ? entriesChronologically : entriesChronologicallyDesc
  )

  let sortFunctionName = $derived(sortFunction.name)

  let plots: Record<string, PlotPoint[]> = $derived.by(() => {
    return createPlotsFromTripList(tripList, $staticContent)
  })

  let tripList = $derived.by(() => {
    let entries = Object.entries($playerActiveTrips)
    return entries.sort(sortFunction)
  })

  const portfolioClass = derived([profitLoss], ([$profitLoss]) => {
    if ($profitLoss === 0) return "neutral"
    return $profitLoss > 0 ? "upText" : "downText"
  })

  const sortByVisit = () => {
    sortFunction = sortDirection === "asc" ? entriesByVisit : entriesByVisitDesc
    sortDirection = sortDirection === "asc" ? "desc" : "asc"
  }

  const sortByProfit = () => {
    sortFunction = sortDirection === "asc" ? entriesByProfit : entriesByProfitDesc
    sortDirection = sortDirection === "asc" ? "desc" : "asc"
  }
</script>

<div class="admin-trip-table-container">
  <div class="table-summary">
    <div class="left">Active trips</div>
    <div class="right">
      Profit:
      <span class={$portfolioClass}>
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
            focus = tripEntry[0]
          }}
          onpointerleave={() => {
            focus = ""
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

    span {
      background: var(--color-death);
      padding: 2px;
      color: var(--background);
    }
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
  }

  .cell-visits {
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
</style>
