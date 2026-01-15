<script lang="ts">
  import { ratTotalValue } from "$lib/modules/state/stores"
  import { CURRENCY_SYMBOL } from "$lib/modules/ui/constants"
  import { Tooltip } from "$lib/components/Shared"

  let { trip, maxValuePerWin }: { trip: Trip; maxValuePerWin: number } = $props()

  const survivalData = $derived(calculateSurvivalRate(trip))
  const displayText = $derived(
    survivalData.percentage !== null ? `${survivalData.percentage}%` : "UNCLEAR"
  )

  const RISK_PROFILE_THRESHOLD = 4 // visits

  function calculateSurvivalRate(trip: Trip) {
    const visitCount = Number(trip.visitCount)

    if (visitCount < RISK_PROFILE_THRESHOLD) {
      return {
        percentage: null,
        category: "unclear"
      }
    }

    const killCount = Number(trip.killCount ?? 0)
    const survivalCount = visitCount - killCount
    const survivalRate = survivalCount / visitCount
    const survivalPercentage = Math.round(survivalRate * 100)

    let category: string
    if (survivalRate >= 0.8) {
      category = "HIGH" // 80%+ survival
    } else if (survivalRate >= 0.5) {
      category = "MID" // 50-89% survival
    } else if (survivalRate >= 0.1) {
      category = "LOW" // 10-49% survival
    } else {
      category = "CRITICAL" // <10% survival
    }

    return {
      percentage: survivalPercentage,
      category
    }
  }

  const isLowBalance = (trip: Trip, maxValuePerWin: number) => {
    if (!trip?.balance || !maxValuePerWin) {
      return false
    }

    /* ========================================
     * Currently, low balance is defined as:
     * - The trip has a balance less than or equal to the max value per win
     ======================================== */
    return Number(trip.balance) <= maxValuePerWin
  }
</script>

<div class="group">
  <div class="meta">RISK</div>
  <div class="meta-data-item max-risk">
    <Tooltip content="WARNING! When you enter a trip you risk your RAT's health and PSYCHO OBJECTS">
      <div class="inner">
        {$ratTotalValue}<span class="currency-symbol">{CURRENCY_SYMBOL}</span>
      </div>
    </Tooltip>
  </div>
</div>

<div class="group">
  <div class="meta">REWARD</div>
  <div class="meta-data-item max-win" class:low-balance={isLowBalance(trip, maxValuePerWin)}>
    <Tooltip content="Max reward your RAT might get from surviving this TRIP">
      <div class="inner">
        {maxValuePerWin}<span class="currency-symbol">{CURRENCY_SYMBOL}</span>
      </div>
    </Tooltip>
  </div>
</div>

<div class="group">
  <div class="meta">SURVIVAL</div>
  <div class="meta-data-item survival-meter {survivalData.category}">
    <Tooltip content="How many RATS have survived this trip so far. Results may vary">
      <div class="inner">{displayText}</div>
    </Tooltip>
  </div>
</div>

<style lang="scss">
  .group {
    width: 100%;
    padding-inline: 5px;
  }

  .meta {
    font-size: var(--font-size-small);
    color: var(--color-grey-lighter);
    margin: 2px 0 3px;
    width: 100%;
    margin-bottom: 3px;
  }

  .meta-data-item {
    background: var(--foreground-semi-transparent);
    color: var(--background);
    margin-bottom: 3px;
    border-radius: 4px;
    font-size: var(--font-size-normal);
    height: 25px;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    margin-bottom: 10px;

    &:hover {
      @media (min-width: 800px) {
        transform: scale(1.1);
      }
    }

    &.low-balance {
      background: var(--color-bad);
    }

    &.UNCLEAR {
      background: var(--foreground-light-transparent);
    }

    &.CRITICAL {
      background: var(--color-bad);
    }

    &.LOW {
      background: var(--color-risk-meter-low);
    }

    &.MID {
      background: var(--color-risk-meter-mid);
    }

    &.HIGH {
      background: var(--color-risk-meter-hi);
    }

    .inner {
      padding: 0;
    }
  }
</style>
