<script lang="ts">
  import { rat } from "$lib/modules/state/stores"
  import { CURRENCY_SYMBOL } from "$lib/modules/ui/constants"

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

<div class="meta">SURVIVAL RATE</div>
<div class="meta-data-item survival-meter {survivalData.category}">
  <!-- <Tooltip content={`SURVIVAL`}> -->
  <div class="inner">{displayText}</div>
  <!-- </Tooltip> -->
</div>

<div class="meta">MAX REWARD</div>
<div class="meta-data-item max-win" class:low-balance={isLowBalance(trip, maxValuePerWin)}>
  <!-- <Tooltip content="MAX WIN"> -->
  <div class="inner">{maxValuePerWin}{CURRENCY_SYMBOL}</div>
  <!-- </Tooltip> -->
</div>

<div class="meta">MAX RISK</div>
<div class="meta-data-item max-risk">
  <!-- <Tooltip content="ENTRY RISK"> -->
  <div class="inner">{$rat.balance}{CURRENCY_SYMBOL}</div>
  <!-- </Tooltip> -->
</div>

<style lang="scss">
  .meta {
    font-size: var(--font-size-small);
    color: var(--color-grey-mid);
    margin: 2px 0 5px;
    width: 100%;
    margin-bottom: 5px;
  }

  .meta-data-item {
    background: rgba(255, 255, 255, 0.4);
    color: var(--background);
    margin-bottom: 4px;
    border-radius: 4px;
    font-size: var(--font-size-normal);
    height: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    margin-bottom: 10px;

    &.low-balance {
      background: red;
    }

    &.UNCLEAR {
      background: rgba(255, 255, 255, 0.4);
    }

    &.CRITICAL {
      background: red;
    }

    &.LOW {
      background: pink;
    }

    &.MID {
      background: yellow;
    }

    &.HIGH {
      background: lightgreen;
    }

    .inner {
      padding: 0;
      // width: 50%;
    }
  }
</style>
