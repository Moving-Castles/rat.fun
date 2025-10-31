<script lang="ts">
  import { Tooltip } from "$lib/components/Shared"
  let { trip }: { trip: Trip } = $props()

  const TOO_FEW_VISITS_THRESHOLD = 1

  const calculateRisk = (trip: Trip) => {
    if (Number(trip.visitCount) < TOO_FEW_VISITS_THRESHOLD) {
      return "UNCLEAR"
    }

    const killRatio = Number(trip.killCount ?? 0) / Number(trip.visitCount)

    if (killRatio < 0.1) {
      return "LOW"
    } else if (killRatio < 0.5) {
      return "MID"
    } else if (killRatio < 0.9) {
      return "HI"
    } else {
      return "NITEMARE"
    }
  }

  const riskProfile = $derived(calculateRisk(trip))
</script>

<div class="meta-data-item max-win {riskProfile.toLowerCase()}">
  <Tooltip content={`Risk profile: ${riskProfile}`}>
    <div class="inner">{riskProfile}</div>
  </Tooltip>
</div>

<style lang="scss">
  .meta-data-item {
    background: rgba(255, 255, 255, 0.4);
    color: var(--background);
    margin-bottom: 5px;
    border-radius: 4px;
    font-size: var(--font-size-normal);
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;

    &.unclear {
      background: rgba(255, 255, 255, 0.4);
    }

    &.low {
      background: lightgreen;
    }

    &.mid {
      background: yellow;
    }

    &.hi {
      background: pink;
    }

    &.nitemare {
      background: red;
    }

    .inner {
      padding: 10px;
    }
  }
</style>
