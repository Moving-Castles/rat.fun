<script lang="ts">
  import { derived } from "svelte/store"
  import {
    balance,
    investment,
    profitLoss,
    portfolioClass,
    realisedProfitLoss,
    playerRooms
  } from "$lib/modules/state/stores"
  import { BigButton } from "$lib/components/Shared"
  import { ProfitLossHistoryGraph } from "$lib/components/Admin"
  import { CURRENCY_SYMBOL } from "$lib/modules/ui/constants"
  import tippy from "tippy.js"

  let { focus, graphData = $bindable(), onCreateRoomClick } = $props()

  let clientHeight = $state(0)

  const plSymbolExplicit = derived(portfolioClass, $pc =>
    $pc === "neutral" ? "" : $pc === "upText" ? "+" : "-"
  )

  const realPortfolioClass = derived([realisedProfitLoss], ([$realisedProfitLoss]) => {
    if ($realisedProfitLoss === 0) return "neutral"
    return $realisedProfitLoss > 0 ? "upText" : "downText"
  })

  const realPlSymbolExplicit = derived(realPortfolioClass, $pc =>
    $pc === "neutral" ? "" : $pc === "upText" ? "+" : "-"
  )

  $effect(() => {
    tippy("[data-tippy-content]", {
      allowHTML: true
    })
  })
</script>

<div bind:clientHeight class="admin-trip-monitor">
  <div class="p-l-overview">
    <div class="top">
      {#if $balance && $investment}
        <!-- Unrealised -->
        <div class="main">
          <p>Active Profit</p>
          <span class="percentage {$portfolioClass} glow"
            >({$plSymbolExplicit}{(100 - ($balance / $investment) * 100).toFixed(2)}%)</span
          >
          <span class="unit {$portfolioClass}">{CURRENCY_SYMBOL}</span>
          <div class="content {$portfolioClass} glow">
            <h1 data-tippy-content="Unrealised P&L" class="">
              {$plSymbolExplicit}{CURRENCY_SYMBOL}{Math.abs($profitLoss)}
            </h1>
          </div>
        </div>
      {:else}
        <div class="main">
          <h1>{$plSymbolExplicit}{CURRENCY_SYMBOL}0</h1>
        </div>
      {/if}
    </div>
    <div class="bottom-left">
      <p>Portfolio</p>
      <h2 class="{$portfolioClass} glow">{CURRENCY_SYMBOL}{$balance}</h2>
    </div>
    <div class="bottom-right">
      <p>Invested</p>
      <h2>{CURRENCY_SYMBOL}{$investment}</h2>
    </div>
    <div class="full-width-bottom">
      <BigButton text="Create Room" onclick={onCreateRoomClick} />
    </div>
  </div>
  <div class="p-l-graph">
    <ProfitLossHistoryGraph bind:graphData trips={$playerRooms} height={clientHeight} {focus} />
  </div>
</div>

<style lang="scss">
  .admin-trip-monitor {
    width: 100%;
    // height: 400px;
    display: flex;
    justify-content: flex-start;
    align-items: center;

    .down {
      background: red;
    }

    .up {
      background: green;
    }
    .downText {
      color: red;

      &.glow {
        filter: drop-shadow(0px 0px 2px rgba(230, 30, 0, 1));
      }
    }

    .upText {
      color: #78ee72;

      &.glow {
        filter: drop-shadow(0px 0px 2px #78ee72);
      }
    }

    h3 {
      margin-bottom: 20px;
    }
    p {
      color: var(--color-grey-light);
      margin: 2rem 1rem;
    }

    p {
      position: absolute;
      top: 0;
      left: 0;
      margin: 1rem 1rem;
      display: inline-block;
    }

    .main {
      background: rgba(0, 0, 0, 0.5);
      padding: 1rem;
      position: relative;
      overflow: hidden;
      height: 154px;
      display: flex;
      justify-content: center;
      align-items: center;

      .unit {
        top: 50%;
        position: absolute;
        font-size: 240px;
        padding: 5px;
        z-index: 0;

        &.upText {
          color: var(--graph-color-up);
        }

        &.downText {
          color: var(--graph-color-down);
        }

        vertical-align: sub;
        display: inline-block;
        filter: blur(4px) opacity(0.4);

        &:not(.offset) {
          left: 0;
          transform: translate(50%, -50%) rotate(-5deg) scale(2, 2);
        }

        &.offset {
          right: 0;
          transform: translate(-50%, -50%) rotate(5deg) scale(2, 2);
        }
      }
      .content {
        position: relative;
        display: flex;
        z-index: 1;
      }

      .calculations {
        display: flex;
        flex-flow: column nowrap;
        justify-content: space-between;
      }
    }
    h1 {
      font-family: var(--special-font-stack);
      font-size: 60px;
      margin: 0;
      vertical-align: middle;
      width: 100%;
      text-align: center;
    }
    .percentage {
      position: absolute;
      top: 1rem;
      right: 1rem;
      display: inline-block;
    }
    h2 {
      font-family: var(--special-font-stack);
      font-size: 2rem;
      display: inline-block;
      text-align: center;
      width: 100%;
      margin-bottom: 2.5rem;
      // margin: 0 1rem;
    }

    .p-l-overview {
      min-width: 500px;
      width: 500px;
      display: grid;
      // padding: 0 1rem;
      position: relative;
      padding: 0 1rem;
      grid-template-columns: repeat(200px, 2);
      grid-template-rows: repeat(1fr, 3);

      .top {
        grid-column: 1/3;
        height: 100%;
        min-height: 120px;
        display: flex;
        flex-flow: column nowrap;
        gap: 1rem;

        .main {
          display: flex;
          flex-flow: column nowrap;
          justify-content: center;
        }
      }

      .full-width-bottom {
        grid-column: 1/3;
        height: 100px;
      }
      .bottom-left,
      .bottom-right {
        width: 100%;
        margin: 0;
        height: 120px;
        display: flex;
        background: rgba(0, 0, 0, 0.2);
        position: relative;
        justify-content: center;
        align-items: flex-end;
      }
    }

    .p-l-graph {
      height: 400px;
      width: 100%;
      background: #222;
      text-align: center;
      display: flex;
      justify-content: center;
      align-items: center;
    }
  }
  // .p-l-events {
  //   width: 400px;
  //   height: var(--game-window-height);
  // }
</style>
