<script lang="ts">
  import { SignedNumber } from "$lib/components/Shared"
  import { TripProfitLossSpark } from "$lib/components/Trip"
  import { goto } from "$app/navigation"

  let { trip, data, id } = $props()

  let profitLoss = $derived(Number(trip.liquidationValue) - Number(trip.tripCreationCost))
</script>

<tr
  onmouseup={() => {
    goto("/admin/" + id, { noScroll: false })
  }}
  class="simple-row"
>
  <td class="cell-description">
    <p class="single-line">{trip.prompt}</p>
  </td>
  <td class="cell-visits">{trip.visitCount}</td>
  <td class="cell-profit">
    <span> {trip.liquidationValue}</span><span class="grey">/{trip.tripCreationCost} </span>
  </td>
  <td class="cell-profit">
    <SignedNumber value={profitLoss} />
  </td>
  <td class="cell-graph">
    {#if data}
      <div class="mini-graph">
        <TripProfitLossSpark smallIcons height={24} plotData={data} isEmpty={data.length === 0} />
      </div>
    {:else}
      <div class="mini-graph" />
    {/if}
  </td>
  <td class="cell-action-or-age"></td>
</tr>

<style lang="scss">
  .simple-row {
    height: 24px;

    td {
      vertical-align: middle;
      line-height: 24px;
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
    }
    td {
      overflow: hidden;
      margin: 0;
      vertical-align: top;
    }
    .cell-description {
      padding: 0 6px;
    }
    .cell-visits {
      width: 120px;
      text-align: right;
    }
    .cell-profit {
      width: 120px;
      text-align: right;

      :global(*) {
        text-align: right;
      }
    }
    .cell-tax-or-age {
      width: 120px;
      text-align: right;
    }
    .cell-graph {
      max-width: 200px;
    }
    .cell-action-or-age {
      max-width: 200px;
      height: 100%;
    }

    .up {
      color: var(--color-up);
    }

    .down {
      color: var(--color-down);
    }

    .grey {
      color: grey;
    }
  }
</style>
