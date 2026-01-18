<script lang="ts">
  import type {
    TripEventCreation,
    TripEventLiquidation,
    TripEventDeath,
    TripEventVisit
  } from "$lib/components/Admin/types"
  import { SmallButton, SignedNumber, Tooltip } from "$lib/components/Shared"
  import { TripProfitLossSpark } from "$lib/components/Admin"
  import { goto } from "$app/navigation"
  import { playSound } from "$lib/modules/sound"
  import { focusTrip } from "$lib/modules/ui/state.svelte"
  import { gameConfig, challengeConfig } from "$lib/modules/state/stores"
  import { blockNumber } from "$lib/modules/network"
  import { UI_STRINGS } from "$lib/modules/ui/ui-strings/index.svelte"

  let {
    trip,
    data,
    id,
    onpointerenter,
    onpointerleave
  }: {
    trip: Trip
    data: (TripEventCreation | TripEventLiquidation | TripEventDeath | TripEventVisit)[]
    id: string
    onpointerenter: () => void
    onpointerleave: () => void
  } = $props()

  let profitLoss = $derived(Number(trip.balance) - Number(trip.tripCreationCost))

  // Go to trip preview
  const rowOnMouseDown = () => {
    playSound({ category: "ratfunUI", id: "panelIn" })
    goto("/trip-lab/" + id, { noScroll: false })
  }

  // Start liquidation
  const liquidateButtonOnMouseUp = (e: MouseEvent) => {
    e.stopPropagation()
    goto("/trip-lab/" + id + "?liquidate", { noScroll: false })
  }

  // Cooldown until trip can be liquidated
  // Challenge trips use activePeriodBlocks from challengeConfig, regular trips use cooldownCloseTrip from gameConfig
  let cooldownBlocks = $derived(
    trip.challengeTrip
      ? Number($challengeConfig?.activePeriodBlocks ?? 0)
      : $gameConfig.cooldownCloseTrip
  )
  let blockUntilUnlock = $derived(
    Number(trip.creationBlock) + cooldownBlocks - Number($blockNumber)
  )
</script>

<tr
  onmousedown={rowOnMouseDown}
  {onpointerenter}
  {onpointerleave}
  class:focus={$focusTrip === id}
  class="active-trip-table-item"
>
  <!-- Index -->
  <td class="cell-index">{Number(trip.index)}</td>
  <!-- Prompt -->
  <td class="cell-prompt">
    <Tooltip content={trip.prompt}>
      <p class="single-line">{trip.prompt}</p>
    </Tooltip>
  </td>
  <!-- Visits -->
  <td class="cell-visits">{Number(trip.visitCount ?? 0)}</td>
  <!-- Kills -->
  <td class="cell-kills">{Number(trip.killCount ?? 0)}</td>
  <!-- Balance -->
  <td class="cell-balance">
    <span>{trip.balance}</span><span class="grey">/{trip.tripCreationCost} </span>
  </td>
  <!-- Profit -->
  <td class="cell-profit">
    <SignedNumber value={profitLoss} />
  </td>
  <!-- Spark -->
  <td class="cell-spark">
    {#if data}
      <div class="mini-graph">
        <TripProfitLossSpark height={24} plotData={data} isEmpty={data.length === 0} />
      </div>
    {:else}
      <div class="mini-graph"></div>
    {/if}
  </td>
  <!-- Action -->
  <td class="cell-action">
    <SmallButton
      disabled={blockUntilUnlock > 0}
      text={blockUntilUnlock <= 0 ? UI_STRINGS.liquidate : UI_STRINGS.waitBlocks(blockUntilUnlock)}
      onmouseup={liquidateButtonOnMouseUp}
    ></SmallButton>
  </td>
</tr>

<style lang="scss">
  .active-trip-table-item {
    height: 24px;
    font-size: var(--font-size-small);
    font-family: var(--admin-font-stack);

    @media (max-width: 800px) {
      height: 36px;
    }

    td {
      vertical-align: middle;
      line-height: 24px;
      border-bottom: 1px solid var(--color-grey-dark);
      border-right: 1px dashed var(--color-grey-dark);

      @media (max-width: 800px) {
        line-height: 36px;
      }
    }

    .single-line {
      margin: 0;
      padding: 0;
      border: none;
      width: 100%;
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

    &.focus {
      cursor: pointer;
      background-color: var(--color-grey-dark);
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

      @media (max-width: 800px) {
        display: none;
      }
    }

    .cell-prompt {
      padding: 0 6px;
    }

    .cell-visits {
      text-align: right;
      width: 60px;
    }

    .cell-kills {
      text-align: right;
      width: 60px;

      @media (max-width: 800px) {
        display: none;
      }
    }

    .cell-balance {
      width: 120px;
      text-align: right;
      width: 80px;

      @media (max-width: 800px) {
        display: none;
      }
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

      @media (max-width: 800px) {
        display: none;
      }
    }

    .cell-action {
      width: 100px;
      height: 100%;
      padding-right: 0;

      @media (max-width: 800px) {
        width: 150px;
      }
    }

    .grey {
      color: var(--color-grey-light);
    }
  }
</style>
