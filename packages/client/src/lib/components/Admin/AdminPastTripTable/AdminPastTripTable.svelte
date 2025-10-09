<script lang="ts">
  import type { PlotPoint } from "$lib/components/Trip/TripGraph/types"
  import { playerLiquidatedTrips, profitLoss, realisedProfitLoss } from "$lib/modules/state/stores"
  import { derived } from "svelte/store"
  import {
    entriesChronologically,
    entriesChronologicallyDesc,
    entriesByRealisedProfit,
    entriesByRealisedProfitDesc,
    entriesByVisit,
    entriesByVisitDesc
  } from "$lib/components/Trip/TripListing/sortFunctions"
  import { gamePercentagesConfig } from "$lib/modules/state/stores"
  import { staticContent } from "$lib/modules/content"
  import { CURRENCY_SYMBOL } from "$lib/modules/ui/constants"

  import AdminTripTableRow from "../AdminTripTable/AdminTripTableRow.svelte"

  let { focus = $bindable() } = $props()

  let sortDirection = $state<"asc" | "desc">("asc")
  let sortFunction = $state(
    sortDirection === "asc" ? entriesChronologically : entriesChronologicallyDesc
  )
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

  let plots: Record<string, PlotPoint[]> = $derived.by(() => {
    const result = Object.fromEntries(
      tripList.map(([tripId, trip]) => {
        let sanityTripContent = $staticContent?.trips?.find(r => r.title == tripId)

        const outcomes = $staticContent?.outcomes?.filter(o => o.tripId == tripId) || []
        // Sort the outcomes in order of creation
        outcomes.sort((a, b) => {
          return new Date(b._createdAt).getTime() - new Date(a._createdAt).getTime()
        })
        const tripOutcomes = outcomes.reverse()
        const value = [
          {
            time: 0,
            tripValue: Number(trip.tripCreationCost),
            meta: sanityTripContent
          },
          ...tripOutcomes
        ].map((o, i) => {
          return {
            time: i,
            value: o?.tripValue || 0,
            meta: o
          }
        })

        // Map the values
        return [tripId, value]
      })
    )

    return result
  })

  let totalLiquidatedBalance = $derived(
    Object.values($playerLiquidatedTrips).reduce(
      (prev, current) => (prev += Number(current.liquidationValue)),
      0
    )
  )

  let tripList = $derived.by(() => {
    let entries = Object.entries($playerLiquidatedTrips)

    return entries.sort(sortFunction)
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
    <div>Liquidated trips</div>

    <div>
      <span
        >Profit: {CURRENCY_SYMBOL}{sign($realisedProfitLoss - taxes)}{Math.abs(
          $realisedProfitLoss - taxes
        )}</span
      >
      <span class="grey">
        (<span class={$portfolioClass}
          >{#if $realisedProfitLoss < 0}-{/if}{CURRENCY_SYMBOL}{Math.abs($realisedProfitLoss)}</span
        >
        <span>- taxes <span class={$taxClass}>{CURRENCY_SYMBOL}{Math.abs(taxes)}</span></span>)
      </span>
    </div>
  </div>
  {#if tripList?.length > 0}
    <table class="admin-trip-table">
      <thead>
        <tr>
          <th><!-- Trip --></th>
          <th onclick={sortByVisit}
            >Visits&nbsp;{#if sortFunctionName === "entriesByVisit"}▼{:else if sortFunctionName === "entriesByVisitDesc"}▲{:else}&nbsp;{/if}</th
          >
          <th>Liquidation</th>
          <th onclick={sortByProfit}
            >Profit{#if sortFunctionName === "entriesByRealisedProfit"}▼{:else if sortFunctionName === "entriesByRealisedProfitDesc"}▲{:else}&nbsp;{/if}</th
          >
          <th>Spark</th>
        </tr>
      </thead>
      <tbody>
        <!-- Adding new table entry -->
        <tr class="simple-row">
          <td colspan="5"></td>
        </tr>
        <!-- --- -->
        {#each tripList as tripEntry (tripEntry[0])}
          <AdminTripTableRow
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
  {:else}
    <div class="no-data">
      <span>NO DATA</span>
    </div>
  {/if}
</div>

<style lang="scss">
  .admin-trip-table-container {
    width: 100%;
    background: rgba(30, 30, 30, 1);
    height: 100%;
    overflow-y: scroll;
    position: relative;
  }
  .admin-trip-table {
    width: 100%;
    // background: black;
    table-layout: fixed;
    /* justify-content: center; */
    /* align-items: center; */
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

  .mini-graph {
    width: 200px;
    height: 80px;
    background: #222;
  }

  :global(.simple-row) {
    &:hover {
      background-color: var(--color-death);
      cursor: pointer;
    }
    td {
      outline: none;
      overflow: hidden;
      margin: 0;
      vertical-align: top;
    }
    .cell-description {
      padding: 0.6rem 0.5rem;
      // min-width: 500px;
    }
    .cell-balance {
      width: 120px;
      // background: red;
    }
    .cell-profit-loss {
      width: 120px;
    }
    .cell-age {
      width: 120px;
    }
    .cell-graph {
      max-width: 200px;
    }
    .cell-actions {
      max-width: 200px;
    }
  }

  .table-summary {
    padding: 10px;
    display: flex;
    justify-content: space-between;
  }

  .downText {
    color: red;
  }

  .upText {
    color: var(--color-up);
  }

  .grey {
    opacity: 0.4;
  }
</style>
