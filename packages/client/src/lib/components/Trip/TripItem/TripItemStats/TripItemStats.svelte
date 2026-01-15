<script lang="ts">
  import { getTripMaxValuePerWin } from "$lib/modules/state/utils"

  import RiskMeterSimple from "./RiskMeterSimple.svelte"

  let { trip }: { trip: Trip } = $props()

  // svelte-ignore state_referenced_locally
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
    flex-direction: column;
    padding: 3px 3px 0 3px;
  }
</style>
