<script lang="ts">
  import type { PlotPoint } from "$lib/components/Trip/TripGraph/types"
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

  import AdminTripTableRow from "./AdminTripTableRow.svelte"

  let { focus = $bindable(), pendingTrip } = $props()

  let sortDirection = $state<"asc" | "desc">("asc")
  let sortFunction = $state(
    sortDirection === "asc" ? entriesChronologically : entriesChronologicallyDesc
  )
  let sortFunctionName = $derived(sortFunction.name)

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
  const sortByAge = () => {
    sortFunction = sortDirection === "asc" ? entriesChronologically : entriesChronologicallyDesc
    sortDirection = sortDirection === "asc" ? "desc" : "asc"
  }
</script>

<div class="admin-trip-table-container">
  <p class="table-summary">
    Active trips <span class={$portfolioClass}
      >({#if $profitLoss < 0}-{/if}{CURRENCY_SYMBOL}{Math.abs($profitLoss)})</span
    >
  </p>
  <table class="admin-trip-table">
    <thead>
      <tr>
        <th><!-- Trip --></th>
        <th onclick={sortByVisit}
          >Visits&nbsp;{#if sortFunctionName === "entriesByVisit"}▼{:else if sortFunctionName === "entriesByVisitDesc"}▲{:else}&nbsp;{/if}</th
        >
        <th>Balance</th>
        <th onclick={sortByProfit}
          >Profit&nbsp;{#if sortFunctionName === "entriesByProfit"}▼{:else if sortFunctionName === "entriesByProfitDesc"}▲{:else}&nbsp;{/if}</th
        >
        <!-- <th onclick={sortByAge}
          >Age&nbsp;{#if sortFunctionName === "entriesChronologically"}▼{:else if sortFunctionName === "entriesChronologicallyDesc"}▲{:else}&nbsp;{/if}</th
        > -->
        <th>Spark</th>
        <th>Actions</th>
      </tr>
    </thead>
    <tbody>
      <!-- Loading row for pending trip creation -->
      {#if pendingTrip && !tripList.map(r => r[1].prompt).includes(pendingTrip.prompt)}
        <tr class="simple-row loading-row">
          <td class="cell-description">
            <p class="single-line">{pendingTrip.prompt}</p>
          </td>
          <td class="cell-balance">0</td>
          <td class="cell-profit-loss">0</td>
          <td class="cell-age">0</td>
          <td class="cell-graph">
            <div class="mini-graph loading-graph"></div>
          </td>
          <td class="cell-actions"> </td>
        </tr>
      {/if}
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
    padding: 0 10px;
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

  .loading {
    height: 24px;
    width: 100%;
    background: red;
    display: block;
  }

  .loading-row {
    opacity: 0.6;
    background: #111;
    pointer-events: none;

    .loading-graph {
      height: 24px;
      width: 100%;
      background: repeating-linear-gradient(90deg, #333 0px, #444 10px, #333 20px);
      animation: loading-shimmer 1s infinite linear;
    }

    .loading-text {
      font-size: 12px;
    }
  }

  @keyframes loading-shimmer {
    0% {
      background-position: 0 0;
    }
    100% {
      background-position: 20px 0;
    }
  }

  .cell-description {
    padding: 0 6px;
  }

  .single-line {
    margin: 0;
    padding: 0;
    border: none;
    max-width: 100%;
    display: inline-block;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .downText {
    color: red;
  }

  .upText {
    color: #78ee72;
  }
</style>
