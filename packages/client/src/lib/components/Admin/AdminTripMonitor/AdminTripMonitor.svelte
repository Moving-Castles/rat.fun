<script lang="ts">
  import { derived } from "svelte/store"
  import { playerActiveRooms, playerLiquidatedRooms, playerRooms } from "$lib/modules/state/stores"
  import { CreateRoom } from "$lib/components/Admin"
  import { BigButton } from "$lib/components/Shared"
  import { MultiTripGraph } from "$lib/components/Admin"
  import { CURRENCY_SYMBOL } from "$lib/modules/ui/constants"
  import { getModalState } from "$lib/components/Shared/Modal/state.svelte"
  import tippy from "tippy.js"
  let { modal } = getModalState()

  let { focus, graphData = $bindable() } = $props()

  let show = $state<"realised" | "unrealised">("unrealised")
  let clientHeight = $state(0)

  // Unrealised
  const investment = derived(playerActiveRooms, $playerActiveRooms =>
    Object.values($playerActiveRooms).reduce((a, b) => a + Number(b.roomCreationCost), 0)
  )
  const balance = derived(playerActiveRooms, $playerActiveRooms =>
    Object.values($playerActiveRooms).reduce((a, b) => a + Number(b.balance), 0)
  )
  const profitLoss = derived([balance, investment], ([$b, $i]) => $b - $i)
  const portfolioClass = derived([profitLoss, balance], ([$profitLoss, $balance]) => {
    if ($profitLoss === 0) return "neutral"
    return $profitLoss < 0 ? "downText" : "upText"
  })

  // Also shows -
  const plSymbolExplicit = derived(portfolioClass, $pc =>
    $pc === "neutral" ? "" : $pc === "upText" ? "+" : "-"
  )

  // Realised
  const realInvestment = derived(playerLiquidatedRooms, $playerLiquidatedRooms =>
    Object.values($playerLiquidatedRooms).reduce((a, b) => a + Number(b.roomCreationCost), 0)
  )
  const realBalance = derived(playerLiquidatedRooms, $playerActiveRooms =>
    Object.values($playerLiquidatedRooms).reduce((a, b) => a + Number(b.liquidationValue), 0)
  )
  const realProfitLoss = derived([realBalance, realInvestment], ([$rb, $i]) => $rb - $i)
  const realPortfolioClass = derived([realProfitLoss], ([$realProfitLoss]) => {
    if ($realProfitLoss === 0) return "neutral"
    return $realProfitLoss > 0 ? "upText" : "downText"
  })

  const realPlSymbolExplicit = derived(realPortfolioClass, $pc =>
    $pc === "neutral" ? "" : $pc === "upText" ? "+" : "-"
  )

  const toggle = () => {
    show = show === "realised" ? "unrealised" : "realised"
  }

  $effect(() => {
    tippy("[data-tippy-content]", {
      allowHTML: true
    })
  })
</script>

{#snippet createTrip()}
  <div class="create-room-wrapper">
    <CreateRoom ondone={modal.close} />
  </div>
{/snippet}

<div bind:clientHeight class="admin-trip-monitor">
  <div class="p-l-overview">
    <div class="top">
      {#if show === "unrealised"}
        {#if $balance && $investment}
          <div onclick={toggle} class="main">
            <p>Unrealised P&L</p>
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
          <h1>None</h1>
        {/if}
      {:else if $realBalance && $realInvestment}
        <div onclick={toggle} class="main">
          <p>Realised P&L</p>
          <span class="percentage {$realPortfolioClass} glow"
            >({$realPlSymbolExplicit}{(100 - ($realBalance / $realInvestment) * 100).toFixed(
              2
            )}%)</span
          >
          <span class="unit {$realPortfolioClass}">{CURRENCY_SYMBOL}</span>
          <div class="content {$realPortfolioClass} glow">
            <h1 data-tippy-content="Realised P&L" class="">
              {$realPlSymbolExplicit}{CURRENCY_SYMBOL}{Math.abs($realProfitLoss)}
            </h1>
          </div>
        </div>
      {:else}
        <h1>None</h1>
      {/if}
    </div>
    <div class="bottom-left">
      {#if show === "unrealised"}
        <p>Portfolio</p>
        <h2 class="{$portfolioClass} glow">{CURRENCY_SYMBOL}{$balance}</h2>
      {:else}
        <p>Portfolio</p>
        <h2 class="{$realPortfolioClass} glow">{CURRENCY_SYMBOL}{$realBalance}</h2>
      {/if}
    </div>
    <div class="bottom-right">
      {#if show === "unrealised"}
        <p>Invested</p>
        <h2>{CURRENCY_SYMBOL}{$investment}</h2>
      {:else}
        <p>Invested</p>
        <h2>{CURRENCY_SYMBOL}{$realInvestment}</h2>
      {/if}
    </div>

    <div class="full-width-bottom">
      <BigButton
        text="Create trip"
        onclick={() => {
          modal.set(createTrip)
        }}
      />
    </div>
  </div>
  <div class="p-l-graph">
    <MultiTripGraph bind:graphData height={clientHeight} {focus} trips={$playerRooms} />
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

    .main {
      background: rgba(0, 0, 0, 0.5);
      padding: 1rem;
      position: relative;
      overflow: hidden;
      height: 100%;

      p {
        position: absolute;
        top: 0;
        left: 0;
        margin: 1rem 1rem;
        display: inline-block;
      }

      .unit {
        top: 50%;
        left: 50%;
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
        transform: translate(-100%, -50%) rotate(-5deg) scale(2, 2);
        filter: blur(4px) opacity(0.4);
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
      height: 100%;
      line-height: 100%;
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
      margin: 0;
      // margin: 0 1rem;
    }

    .p-l-overview {
      min-width: 500px;
      width: 500px;
      height: 400px;
      display: grid;
      gap: 1rem;
      // padding: 0 1rem;
      position: relative;
      grid-template-columns: repeat(200px, 2);
      grid-template-rows: repeat(1fr, 2);

      .top {
        grid-column: 1/3;
        height: 100%;
        min-height: 120px;

        .main {
          display: flex;
          flex-flow: column nowrap;
          justify-content: center;
        }
      }

      .full-width-bottom {
        grid-column: 1/3;
      }
      .bottom-left,
      .bottom-right {
        width: 100%;
        margin: 0;
        background: rgba(0, 0, 0, 0.2);

        p {
          margin: 1.2rem 1rem;
        }
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
