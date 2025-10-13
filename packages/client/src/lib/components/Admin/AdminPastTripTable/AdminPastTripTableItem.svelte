<script lang="ts">
  import type { PlotPoint } from "$lib/components/Admin/types"
  import { SignedNumber } from "$lib/components/Shared"
  import { TripProfitLossSpark } from "$lib/components/Admin"
  import { goto } from "$app/navigation"

  let {
    trip,
    data,
    id,
    onpointerenter,
    onpointerleave
  }: {
    trip: Trip
    data: PlotPoint[]
    id: string
    onpointerenter: () => void
    onpointerleave: () => void
  } = $props()

  let profitLoss = $derived(Number(trip.liquidationValue) - Number(trip.tripCreationCost))

  const onmouseup = () => {
    goto("/admin/" + id, { noScroll: false })
  }
</script>

<tr {onmouseup} {onpointerenter} {onpointerleave} class="active-trip-table-item">
  <!-- Index -->
  <td class="cell-index">{Number(trip.index)}</td>
  <!-- Prompt -->
  <td class="cell-prompt">
    <p class="single-line">{trip.prompt}</p>
  </td>
  <!-- Visits -->
  <td class="cell-visits">{trip.visitCount}</td>
  <!-- Liquidation -->
  <td class="cell-balance">
    <span>{trip.liquidationValue}</span><span class="grey">/{trip.tripCreationCost} </span>
  </td>
  <!-- Profit -->
  <td class="cell-profit">
    <SignedNumber value={profitLoss} />
  </td>
  <!-- Spark -->
  <td class="cell-spark">
    {#if data}
      <div class="mini-graph">
        <TripProfitLossSpark smallIcons height={24} plotData={data} isEmpty={data.length === 0} />
      </div>
    {:else}
      <div class="mini-graph"></div>
    {/if}
  </td>
</tr>

<style lang="scss">
  .active-trip-table-item {
    height: 24px;
    font-size: var(--font-size-small);

    td {
      vertical-align: middle;
      line-height: 24px;
      border-bottom: 1px solid rgb(59, 59, 59);
      border-right: 1px dashed rgb(59, 59, 59);
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

    * {
      border: none;
      outline: none;
      border-width: 0;
    }

    &:hover {
      cursor: pointer;
      background-color: rgb(59, 59, 59);
    }

    td {
      overflow: hidden;
      margin: 0;
      vertical-align: top;
      padding-right: 1ch;
    }

    .cell-index {
      text-align: center;
      width: 40px;
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

      :global(*) {
        text-align: right;
      }
    }

    .cell-spark {
      width: 80px;
    }

    .grey {
      color: grey;
    }
  }
</style>
