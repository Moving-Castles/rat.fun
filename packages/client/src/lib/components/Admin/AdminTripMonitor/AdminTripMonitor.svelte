<script lang="ts">
  import { derived } from "svelte/store"
  import { playerActiveRooms } from "$lib/modules/state/stores"
  import { MultiTripGraph } from "$lib/components/Admin"
  import { CURRENCY_SYMBOL } from "$lib/modules/ui/constants"

  let { focus } = $props()

  let clientHeight = $state(0)

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
  const plSymbol = derived(portfolioClass, $pc =>
    $pc === "neutral" ? "" : $pc === "upText" ? "+" : ""
  )
  // Also shows -
  const plSymbolExplicit = derived(portfolioClass, $pc =>
    $pc === "neutral" ? "" : $pc === "upText" ? "+" : "-"
  )
</script>

<div bind:clientHeight class="admin-trip-monitor">
  <div class="p-l-overview">
    <div class="top">
      <h3>Active trips</h3>
      {#if $balance && $investment}
        <div class="main">
          <span class="unit">{CURRENCY_SYMBOL}</span>
          <div class="content {$portfolioClass} glow">
            <h1 class="">{$plSymbol}{$profitLoss}</h1>
            <div class="calculations">
              <span class="percentage">({(($balance / $investment) * 100).toFixed(2)}%)</span>
            </div>
          </div>
        </div>
        <!-- {$balance / $investment} -->
      {:else}
        <h1>None</h1>
      {/if}
    </div>
    <div class="bottom-left">
      <p>Portfolio</p>
      <h2 class="{$portfolioClass} glow">{$plSymbolExplicit}{$balance}</h2>
    </div>
    <div class="bottom-right">
      <p>Invested</p>
      <h2>{$investment}</h2>
    </div>
  </div>
  <div class="p-l-graph">
    <MultiTripGraph height={clientHeight} {focus} trips={$playerActiveRooms} />
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
      border-radius: 4px;
      padding: 2rem 1.8rem 1rem;
      position: relative;
      overflow: hidden;

      .unit {
        top: 50%;
        left: 50%;
        position: absolute;
        font-size: 240px;
        padding: 5px;
        z-index: 0;
        color: rgba(230, 30, 0, 1);
        // color: rgba(100, 255, 200, 1);
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
      margin: 2rem 1rem;
      width: 100%;
      text-align: center;

      .percentage {
        font-size: 2rem;
        display: inline-block;
        transform: translate(-100%, 0);
      }
    }
    h2 {
      font-family: var(--special-font-stack);
      font-size: 2rem;
      margin: 1.2rem 1rem;
    }

    .p-l-overview {
      padding-left: 2rem;
      padding-top: 2rem;
      padding-bottom: 2rem;
      padding-right: 1rem;
      min-width: 500px;
      width: 500px;
      display: grid;
      position: relative;
      grid-template-columns: repeat(1fr, 2);
      grid-template-rows: repeat(1fr, 2);
      gap: 1rem;

      .top {
        grid-column: 1/3;
        padding: 0.2rem;
      }
      .bottom-left,
      .bottom-right {
        padding: 0.2rem;
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
</style>
