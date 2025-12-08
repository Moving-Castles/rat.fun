<script lang="ts">
  import { onMount } from "svelte"
  import { derived } from "svelte/store"
  import { Tween } from "svelte/motion"
  import { busy } from "$lib/modules/action-manager/index.svelte"
  import { playSound } from "$lib/modules/sound"
  import { Tooltip, BigButton, ResizableText } from "$lib/components/Shared"
  import { balance, investment, profitLoss, portfolioClass } from "$lib/modules/state/stores"
  import { CURRENCY_SYMBOL } from "$lib/modules/ui/constants"
  import { UI_STRINGS } from "$lib/modules/ui/ui-strings/index.svelte"

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
        ({$plSymbolExplicit}{Math.abs((100 - tweenedActiveProfit.current * 100).toFixed(2))}%)
      </div>
      <div class="content {$portfolioClass}">
        <Tooltip content={UI_STRINGS.activeProfit}>
          <div class="profit-amount">
            <ResizableText options={{ widthOnly: true }}>
              <span class="symbol-explicit">{$plSymbolExplicit}</span>{Math.abs(
                Math.floor(tweenedProfitLoss.current)
              )}
              {CURRENCY_SYMBOL}
            </ResizableText>
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
        <ResizableText options={{ widthOnly: true }}>
          {$investment}
          {CURRENCY_SYMBOL}
        </ResizableText>
      </div>
    </div>
    <div class="portfolio-box">
      <p>{UI_STRINGS.portfolio}</p>
      <div class="portfolio-amount">
        <ResizableText options={{ widthOnly: true }}>
          {$balance}
          {CURRENCY_SYMBOL}
        </ResizableText>
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
        background: var(--background-semi-transparent);
        position: relative;
        overflow: hidden;
        height: 100%;
        display: flex;
        justify-content: center;
        align-items: center;

        .unit {
          top: 50%;
          position: absolute;
          font-size: var(--font-size-ultra);
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
          width: 100%;
          padding: 1rem;
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
      height: 100px;
      display: flex;
      flex-flow: row nowrap;

      .portfolio-box {
        width: 50%;
        height: 100%;
        display: flex;
        background: var(--background-light-transparent);
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
    background: var(--color-down);
  }

  .up {
    background: var(--color-up);
  }
  .downText {
    color: var(--color-down);
  }

  .upText {
    color: var(--color-up);
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
    top: 10px;
    right: 10px;
    display: inline-block;
    font-size: var(--font-size-small);
  }

  .profit-amount {
    font-family: var(--special-font-stack);
    margin: 0;
    width: 100%;
    text-align: center;
    font-size: var(--font-size-super-large);
    position: relative;
    display: flex;

    .symbol-explicit {
      // position: absolute;
      // left: 0;
      // transform: translate(-100%, 0);
    }

    @media screen and (min-width: 1024px) {
      font-size: var(--font-size-super-large);
    }

    .profit-amount-value {
      margin-right: 2px;
      position: relative;
    }
  }

  .portfolio-amount {
    font-family: var(--special-font-stack);
    font-size: var(--font-size-extra-large);
    display: inline-block;
    width: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 12px;

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
