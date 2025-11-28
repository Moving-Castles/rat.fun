<script lang="ts">
  import * as sortFunctions from "$lib/components/Trip/TripListing/sortFunctions"
  import { realisedProfitLoss } from "$lib/modules/state/stores"
  import { focusTrip, focusEvent } from "$lib/modules/ui/state.svelte"
  import { SignedNumber } from "$lib/components/Shared"
  import { UI_STRINGS } from "$lib/modules/ui/ui-strings/index.svelte"

  import AdminPastTripTableItem from "../AdminPastTripTable/AdminPastTripTableItem.svelte"

  let {
    tripList,
    sortFunction = $bindable(),
    sortDirection = $bindable()
  }: {
    tripList: [string, Trip][]
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
      sortDirection === "asc"
        ? sortFunctions.entriesByRealisedProfit
        : sortFunctions.entriesByRealisedProfitDesc
    sortDirection = sortDirection === "asc" ? "desc" : "asc"
  }

  const onpointerenter = (id: string) => {
    $focusTrip = id
    $focusEvent = -1
  }

  const onpointerleave = () => {
    $focusTrip = ""
    $focusEvent = -1
  }
</script>

<div class="admin-trip-table-container">
  <table class="admin-trip-table">
    <thead>
      <tr>
        <!-- Index -->
        <th class="cell-index">#</th>
        <!-- Prompt -->
        <th class="cell-prompt">{UI_STRINGS.trip}</th>
        <!-- Visits -->
        <th class="cell-visits" onclick={sortByVisit}>
          {#if sortFunctionName === "entriesByVisit"}▼{:else if sortFunctionName === "entriesByVisitDesc"}▲{/if}&nbsp;{UI_STRINGS.visits}
        </th>
        <!-- Kills -->
        <th class="cell-kills">{UI_STRINGS.kills}</th>
        <!-- Liquidation -->
        <th class="cell-balance">{UI_STRINGS.balance}</th>
        <!-- Profit -->
        <th class="cell-profit" onclick={sortByProfit}>
          {#if sortFunctionName === "entriesByRealisedProfit"}▼{:else if sortFunctionName === "entriesByRealisedProfitDesc"}▲{/if}&nbsp;{UI_STRINGS.profit}
        </th>
        <th class="cell-liquidated">{UI_STRINGS.causeOfDeathShort}</th>
      </tr>
    </thead>
    <tbody>
      {#each tripList as tripEntry (tripEntry[0])}
        <AdminPastTripTableItem
          id={tripEntry[0]}
          trip={tripEntry[1]}
          onpointerenter={() => onpointerenter(tripEntry[0])}
          {onpointerleave}
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
  }

  th {
    font-size: var(--font-size-small);
    border-top: 1px solid rgb(59, 59, 59);
    border-bottom: 1px solid rgb(59, 59, 59);
    border-right: 1px dashed rgb(59, 59, 59);
    height: 24px;
    padding-right: 1ch;
    position: sticky;
    top: 0;
    background: black;
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

  .cell-liquidated {
    width: 100px;
  }
</style>
