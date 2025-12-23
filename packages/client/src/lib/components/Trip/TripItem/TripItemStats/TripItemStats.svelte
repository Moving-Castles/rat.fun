<script lang="ts">
  import { getTripMaxValuePerWin } from "$lib/modules/state/utils"

  import RiskMeterSimple from "./RiskMeterSimple.svelte"

  let { trip }: { trip: Trip } = $props()

  const maxValuePerWin = getTripMaxValuePerWin(
    trip.tripCreationCost,
    trip.balance,
    trip.challengeTrip,
    trip.overrideMaxValuePerWinPercentage
  )
</script>

<div class="meta-data">
  <RiskMeterSimple {trip} maxValuePerWin={$maxValuePerWin} />
  <!-- Rest of alerts moved to trip avatar overlay -->
</div>

<style lang="scss">
  .meta-data {
    width: 100%;
    height: 100%;
    user-select: none;
    display: flex;
    padding: 8px 8px 0 8px;

    @media (min-width: 800px) {
      justify-content: flex-start;
      flex-direction: column;
    }

    @media (max-width: 800px) {
      gap: 12px;
    }
  }
</style>
