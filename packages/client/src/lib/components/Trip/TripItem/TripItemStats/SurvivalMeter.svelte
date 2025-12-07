<script lang="ts">
  import { Tooltip } from "$lib/components/Shared"
  let { trip }: { trip: Trip } = $props()

  const SURVIVAL_THRESHOLD = 4 // visits

  const calculateSurvivalRate = (trip: Trip) => {
    const visitCount = Number(trip.visitCount)

    if (visitCount < SURVIVAL_THRESHOLD) {
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
    if (survivalRate >= 0.9) {
      category = "high" // 90%+ survival
    } else if (survivalRate >= 0.5) {
      category = "mid" // 50-89% survival
    } else if (survivalRate >= 0.1) {
      category = "low" // 10-49% survival
    } else {
      category = "critical" // <10% survival
    }

    return {
      percentage: survivalPercentage,
      category
    }
  }

  const survivalData = $derived(calculateSurvivalRate(trip))
  const displayText = $derived(
    survivalData.percentage !== null ? `${survivalData.percentage}%` : "UNCLEAR"
  )
</script>

<div class="meta-data-item survival-meter {survivalData.category}">
  <Tooltip content={`SURVIVAL`}>
    <div class="inner">{displayText}</div>
  </Tooltip>
</div>

<style lang="scss">
  .meta-data-item {
    background: var(--foreground-light-transparent);
    color: var(--background);
    margin-bottom: 5px;
    border-radius: 4px;
    font-size: var(--font-size-normal);
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;

    &.unclear {
      background: var(--foreground-light-transparent);
    }

    &.high {
      background: var(--color-risk-meter-low);
    }

    &.mid {
      background: var(--color-risk-meter-mid);
    }

    &.low {
      background: var(--color-risk-meter-hi);
    }

    &.critical {
      background: var(--color-bad);
    }

    .inner {
      padding: 10px;
    }
  }
</style>
