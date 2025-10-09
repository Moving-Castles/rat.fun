<script lang="ts">
  import { SmallButton } from "$lib/components/Shared"
  import { ProfitLossGraph } from "$lib/components/Trip"
  import { goto } from "$app/navigation"
  import { blocksToReadableTime } from "$lib/modules/utils"
  import { blockNumber } from "$lib/modules/network"
  import { gamePercentagesConfig } from "$lib/modules/state/stores"

  let { trip, data, id, onpointerenter, onpointerleave } = $props()

  const untaxed = (value: number) =>
    Math.floor((Number(value) * 100) / (100 - Number($gamePercentagesConfig.taxationCloseTrip)))

  let profitLoss = $derived(
    trip.liquidationBlock
      ? untaxed(Number(trip.liquidationValue)) - Number(trip.tripCreationCost)
      : Number(trip.balance) - Number(trip.tripCreationCost)
  )
  let liquidated = $derived(trip.liquidationBlock)
  let profitLossClass = $derived(profitLoss == 0 ? "" : profitLoss > 0 ? "up" : "down")
</script>

<tr
  {onpointerenter}
  {onpointerleave}
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
    {#if liquidated}<span> {untaxed(trip.liquidationValue)}</span><span class="grey"
        >/{trip.tripCreationCost}
      </span>
    {:else}
      <span>{trip.balance}</span><span class="grey">/{trip.tripCreationCost} </span>
    {/if}
  </td>
  <td class="cell-tax-or-age {profitLossClass}">
    {profitLoss}
  </td>
  <td class="cell-graph">
    {#if data}
      <div class="mini-graph">
        <ProfitLossGraph smallIcons height={24} plotData={data} isEmpty={data.length === 0} />
      </div>
    {:else}
      <div class="mini-graph" />
    {/if}
  </td>

  {#if !liquidated}
    <td class="cell-action-or-age">
      <SmallButton
        text="Liquidate"
        onmouseup={e => {
          e.stopPropagation()
          goto("/admin/" + id + "?liquidate", { noScroll: false })
        }}
      ></SmallButton>
    </td>
  {/if}
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
      // background: #222;
      cursor: pointer;
    }
    td {
      overflow: hidden;
      margin: 0;
      vertical-align: top;
    }
    .cell-description {
      padding: 0 6px;
      // min-width: 500px;
    }
    .cell-visits {
      width: 120px;
      text-align: right;
      // background: red;
    }
    .cell-profit {
      width: 120px;
      text-align: right;
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
      color: var(--graph-color-up);
    }

    .down {
      color: var(--graph-color-down);
    }

    .grey {
      color: grey;
    }
  }
</style>
