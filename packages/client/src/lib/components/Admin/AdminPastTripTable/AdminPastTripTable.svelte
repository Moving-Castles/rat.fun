<script lang="ts">
  import type { PlotPoint } from "$lib/components/Admin/types"
  import { playerLiquidatedTrips, realisedProfitLoss } from "$lib/modules/state/stores"
  import { derived } from "svelte/store"
  import {
    entriesChronologically,
    entriesChronologicallyDesc,
    entriesByRealisedProfit,
    entriesByRealisedProfitDesc,
    entriesByVisit,
    entriesByVisitDesc
  } from "$lib/components/Trip/TripListing/sortFunctions"
  import { staticContent } from "$lib/modules/content"
  import { CURRENCY_SYMBOL } from "$lib/modules/ui/constants"

  import AdminPastTripTableItem from "../AdminPastTripTable/AdminPastTripTableItem.svelte"
  import { createPlotsFromTripList } from "../helpers"

  let { focus = $bindable() }: { focus: string } = $props()

  let sortDirection = $state<"asc" | "desc">("asc")
  let sortFunction = $state(entriesChronologically)
  let sortFunctionName = $derived(sortFunction.name)

  const sortByVisit = () => {
    sortFunction = sortDirection === "asc" ? entriesByVisit : entriesByVisitDesc
    sortDirection = sortDirection === "asc" ? "desc" : "asc"
  }
  const sortByProfit = () => {
    sortFunction = sortDirection === "asc" ? entriesByRealisedProfit : entriesByRealisedProfitDesc
    sortDirection = sortDirection === "asc" ? "desc" : "asc"
  }
  const sortByAge = () => {
    sortFunction = sortDirection === "asc" ? entriesChronologically : entriesChronologicallyDesc
    sortDirection = sortDirection === "asc" ? "desc" : "asc"
  }

  const sign = (num: number) => (num === 0 ? "" : num > 0 ? "+" : "-")

  let tripList = $derived.by(() => {
    let entries = Object.entries($playerLiquidatedTrips)
    return entries.sort(sortFunction)
  })

  let plots: Record<string, PlotPoint[]> = $derived.by(() => {
    return createPlotsFromTripList(tripList, $staticContent)
  })

  let taxes = $derived(
    Math.ceil(
      Object.values($playerLiquidatedTrips).reduce(
        (total, trip) =>
          total + (Number(trip.liquidationValue) * Number(trip.liquidationTaxPercentage)) / 100,
        0
      )
    )
  )

  const portfolioClass = derived([realisedProfitLoss], ([$realisedProfitLoss]) => {
    if ($realisedProfitLoss === 0) return "neutral"
    return $realisedProfitLoss > 0 ? "upText" : "downText"
  })

  const taxClass = derived([realisedProfitLoss], ([$realisedProfitLoss]) => {
    if ($realisedProfitLoss === 0) return "neutral"
    return $realisedProfitLoss > 0 ? "upText" : "downText"
  })
</script>

<div class="admin-trip-table-container">
  <div class="table-summary">
    <div class="left">Liquidated trips</div>
    <div class="right">
      Profit:
      <span class={$portfolioClass}>
        {#if $realisedProfitLoss < 0}-{/if}{CURRENCY_SYMBOL}{Math.abs($realisedProfitLoss)}
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
        <!-- Liquidation -->
        <th class="cell-balance">Liquidation</th>
        <!-- Profit -->
        <th class="cell-profit" onclick={sortByProfit}>
          {#if sortFunctionName === "entriesByRealisedProfit"}▼{:else if sortFunctionName === "entriesByRealisedProfitDesc"}▲{/if}&nbsp;Profit
        </th>
        <!-- Spark -->
        <th class="cell-spark"></th>
      </tr>
    </thead>
    <tbody>
      {#each tripList as tripEntry (tripEntry[0])}
        <AdminPastTripTableItem
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
  }

  .downText {
    color: red;
  }

  .upText {
    color: #78ee72;
  }
</style>
