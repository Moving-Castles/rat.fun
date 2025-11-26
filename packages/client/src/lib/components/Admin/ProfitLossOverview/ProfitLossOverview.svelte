<script lang="ts">
  import { onMount } from "svelte"
  import { derived } from "svelte/store"
  import { Tween } from "svelte/motion"
  import { busy } from "$lib/modules/action-manager/index.svelte"
  import { playSound } from "$lib/modules/sound"
  import { Tooltip, BigButton } from "$lib/components/Shared"
  import { balance, investment, profitLoss, portfolioClass } from "$lib/modules/state/stores"
  import { CURRENCY_SYMBOL } from "$lib/modules/ui/constants"
  import { UI_STRINGS } from "$lib/modules/ui/ui-strings"

  let { onCreateTripClick }: { onCreateTripClick: () => void } = $props()

  let tweenedProfitLoss = new Tween($profitLoss, { duration: 2000 })
  let tweenedActiveProfit = new Tween($balance / $investment)
  let previousProfitLoss = $state<null | number>(null)

  const plSymbolExplicit = derived(portfolioClass, $pc =>
    $pc === "neutral" ? "" : $pc === "upText" ? "+" : "-"
  )

  onMount(() => {
    const unsubscribe = profitLoss.subscribe(newValue => {
      if (typeof previousProfitLoss === "number") {
        if (newValue > previousProfitLoss) {
          playSound({ category: "ratfunUI", id: "tokenPositive" })
          tweenedProfitLoss.set(newValue, { duration: 3000 })
        } else {
          if (newValue !== 0) {
            playSound({ category: "ratfunUI", id: "tokenNegative" })
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
  <!-- Profit -->
  <div class="profit-container">
    <!-- Active profit -->
    <div class="profit-inner">
      <p>{UI_STRINGS.activeProfit}</p>
      <div class="percentage {$portfolioClass}">
        ({$plSymbolExplicit}{(100 - tweenedActiveProfit.current * 100).toFixed(2)}%)
      </div>
      <div class="content {$portfolioClass}">
        <Tooltip content={UI_STRINGS.activeProfit}>
          <div class="profit-amount">
            <span class="profit-amount-value">
              {$plSymbolExplicit}{Math.abs(Math.floor(tweenedProfitLoss.current))}
            </span>
            <span class="currency-symbol">
              {CURRENCY_SYMBOL}
            </span>
          </div>
        </Tooltip>
      </div>
    </div>
  </div>
  <!-- Portfolio -->
  <div class="portfolio-container">
    <div class="portfolio-box">
      <p>{UI_STRINGS.invested}</p>
      <div class="portfolio-amount">
        <div class="portfolio-amount-inner">
          <span class="portfolio-amount-value">{$investment}</span>
          <span class="currency-symbol">
            {CURRENCY_SYMBOL}
          </span>
        </div>
      </div>
    </div>
    <div class="portfolio-box">
      <p>{UI_STRINGS.portfolio}</p>
      <div class="portfolio-amount">
        <div class="portfolio-amount-inner">
          <span class="portfolio-amount-value">{$balance}</span>
          <span class="currency-symbol">
            {CURRENCY_SYMBOL}
          </span>
        </div>
      </div>
    </div>
  </div>
  <!-- Action -->
  <div class="action-container">
    <BigButton
      type="create_trip"
      disabled={busy.CreateTrip.current > 0}
      text={UI_STRINGS.createTrip}
      onclick={onCreateTripClick}
    />
  </div>
</div>

<style lang="scss">
  .profit-loss-overview {
    position: relative;
    padding: 10px;
    height: 100%;
    width: 100%;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    user-select: none;

    .profit-container {
      flex: 1;
      display: flex;
      flex-flow: column nowrap;

      .profit-inner {
        background: rgba(0, 0, 0, 0.5);
        padding: 1rem;
        position: relative;
        overflow: hidden;
        height: 100%;
        display: flex;
        justify-content: center;
        align-items: center;

        .unit {
          top: 50%;
          position: absolute;
          font-size: 240px;
          padding: 5px;
          z-index: var(--z-background);

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
          z-index: var(--z-base);
        }

        .calculations {
          display: flex;
          flex-flow: column nowrap;
          justify-content: space-between;
        }
      }
    }

    .portfolio-container {
      height: 80px;
      display: flex;
      flex-flow: row nowrap;

      .portfolio-box {
        width: 50%;
        height: 100%;
        display: flex;
        background: rgba(0, 0, 0, 0.2);
        position: relative;
        justify-content: center;
        align-items: center;

        &:first-child {
          border-right: 1px solid var(--color-border);
        }
      }
    }

    .action-container {
      height: 160px;
      padding-top: 10px;

      @media (max-width: 800px) {
        height: 200px;
      }
    }
  }

  .down {
    background: red;
  }

  .up {
    background: green;
  }
  .downText {
    color: red;
  }

  .upText {
    color: #78ee72;

    &.glow {
      filter: drop-shadow(0px 0px 2px #78ee72);
    }
  }
  p {
    position: absolute;
    top: 10px;
    left: 10px;
    display: inline-block;
    color: var(--color-grey-light);
    font-size: var(--font-size-small);
    margin: 0;
  }

  .percentage {
    position: absolute;
    top: 1rem;
    right: 1rem;
    display: inline-block;
  }

  .profit-amount {
    font-family: var(--special-font-stack);
    font-size: 82px;
    margin: 0;
    width: 100%;
    text-align: center;

    .profit-amount-value {
      margin-right: 2px;
    }
  }

  .portfolio-amount {
    font-family: var(--special-font-stack);
    font-size: 42px;
    display: inline-block;
    width: 100%;
    display: flex;
    justify-content: center;
    align-items: center;

    .portfolio-amount-inner {
      display: flex;
      justify-content: center;
      align-items: center;

      .portfolio-amount-value {
        margin-right: 5px;
      }
    }
  }
</style>
