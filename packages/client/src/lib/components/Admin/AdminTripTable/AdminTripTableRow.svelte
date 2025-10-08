<script lang="ts">
  import { SmallButton } from "$lib/components/Shared"
  import { RoomConfirmLiquidation } from "$lib/components/Room"
  import { ProfitLossGraph } from "$lib/components/Room"
  import { goto } from "$app/navigation"
  import { blocksToReadableTime } from "$lib/modules/utils"
  import { blockNumber } from "$lib/modules/network"
  import { gamePercentagesConfig } from "$lib/modules/state/stores"
  import { getModalState } from "$lib/components/Shared/Modal/state.svelte"

  let { room, data, id, onpointerenter, onpointerleave } = $props()

  let profitLoss = $derived(
    room.liquidationBlock
      ? room.liquidationValue - room.roomCreationCost
      : room.balance - room.roomCreationCost
  )
  let liquidated = $derived(room.liquidationBlock)
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
    <p class="single-line">{room.prompt}</p>
  </td>
  <td class="cell-balance">{room.visitCount}</td>
  <td class="cell-profit-loss {profitLossClass}">{profitLoss}</td>
  <td class="cell-age">
    {#if liquidated}
      {$gamePercentagesConfig.taxationCloseRoom}
    {:else}
      {blocksToReadableTime(Number($blockNumber) - Number(room.creationBlock))}
    {/if}
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
  <td class="cell-actions">
    {#if liquidated}
      {blocksToReadableTime(Number(room.liquidationBlock) - Number(room.creationBlock))}
    {:else}
      <SmallButton
        text="Liquidate"
        onmouseup={e => {
          e.stopPropagation()
          goto("/admin/" + id + "?liquidate", { noScroll: false })
        }}
      ></SmallButton>
    {/if}
  </td>
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
    .cell-balance {
      width: 120px;
      text-align: right;
      // background: red;
    }
    .cell-profit-loss {
      width: 120px;
      text-align: right;
    }
    .cell-age {
      width: 120px;
      text-align: right;
    }
    .cell-graph {
      max-width: 200px;
    }
    .cell-actions {
      max-width: 200px;
      height: 100%;
    }

    .up {
      color: var(--graph-color-up);
    }

    .down {
      color: var(--graph-color-down);
    }
  }
</style>
