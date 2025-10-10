<script lang="ts">
  import { onMount } from "svelte"
  import { derived } from "svelte/store"
  import { Tween } from "svelte/motion"
  import { playSound } from "$lib/modules/sound"
  import { Tooltip, BigButton } from "$lib/components/Shared"
  import {
    balance,
    investment,
    profitLoss,
    portfolioClass,
    realisedProfitLoss
  } from "$lib/modules/state/stores"
  import { CURRENCY_SYMBOL } from "$lib/modules/ui/constants"

  let { graphData = $bindable(), onCreateTripClick } = $props()

  let tweenedProfitLoss = new Tween($profitLoss, { duration: 2000 })
  let tweenedActiveProfit = new Tween($balance / $investment)
  let previousProfitLoss = $state<null | number>(null)

  onMount(() => {
    const unsubscribe = profitLoss.subscribe(newValue => {
      if (typeof previousProfitLoss === "number") {
        if (newValue > previousProfitLoss) {
          playSound("ratfunUI", "countUp")
          tweenedProfitLoss.set(newValue, { duration: 3000 })
        } else {
          if (newValue !== 0) {
            playSound("ratfunUI", "countDown")
          }
          tweenedProfitLoss.set(newValue, { duration: 2000 })
        }
      }
      previousProfitLoss = newValue
    })

    return () => unsubscribe()
  })

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

  onMount(() => {
    const unsubscribe = profitLoss.subscribe(newValue => {
      if (typeof previousProfitLoss === "number") {
        if (newValue > previousProfitLoss) {
          playSound("ratfunUI", "countUp")
          tweenedProfitLoss.set(newValue, { duration: 3000 })
        } else {
          if (newValue !== 0) {
            playSound("ratfunUI", "countDown")
          }
          tweenedProfitLoss.set(newValue, { duration: 2000 })
        }
      }
      previousProfitLoss = newValue
    })

    return () => unsubscribe()
  })
</script>

<div class="profit-loss-overview">
  <div class="top">
    <!-- Unrealised -->
    <div class="main">
      <p>Active Profit</p>
      <span class="percentage {$portfolioClass} glow"
        >({$plSymbolExplicit}{(100 - tweenedActiveProfit.current * 100).toFixed(2)}%)</span
      >
      <span class="unit {$portfolioClass}">{CURRENCY_SYMBOL}</span>
      <div class="content {$portfolioClass} glow">
        <Tooltip content="Unrealised P&L">
          <h1 class="">
            {$plSymbolExplicit}{CURRENCY_SYMBOL}{Math.abs(Math.floor(tweenedProfitLoss.current))}
          </h1>
        </Tooltip>
      </div>
    </div>
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
    <BigButton text="Create Trip" onclick={onCreateTripClick} />
  </div>
</div>

<style lang="scss">
  .profit-loss-overview {
    position: relative;
    padding: 1rem;
    height: 100%;
    display: grid;
    grid-template-columns: repeat(200px, 2);
    grid-template-rows: repeat(1fr, 3);
    width: 100%;
  }
  .top {
    grid-column: 1/3;
    height: 100%;
    min-height: 120px;
    display: flex;
    flex-flow: column nowrap;
    gap: 1rem;
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
        color: var(--color-up);
      }

      &.downText {
        color: var(--color-down);
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
</style>
