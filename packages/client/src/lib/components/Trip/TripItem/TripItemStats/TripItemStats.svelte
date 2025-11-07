<script lang="ts">
  import { getTripMaxValuePerWin } from "$lib/modules/state/utils"

  import RiskMeter from "./RiskMeter.svelte"
  import RewardMeter from "./RewardMeter.svelte"
  import PopularAlert from "./PopularAlert.svelte"
  import LowBalanceAlert from "./LowBalanceAlert.svelte"

  let { trip }: { trip: Trip } = $props()

  const maxValuePerWin = getTripMaxValuePerWin(trip.tripCreationCost, trip.balance)
</script>

<div class="meta-data">
  <!-- METERS -->
  <RiskMeter {trip} />
  <RewardMeter maxValuePerWin={$maxValuePerWin} />
  <!-- ALERTS -->
  <PopularAlert {trip} />
  <LowBalanceAlert {trip} maxValuePerWin={$maxValuePerWin} />
</div>

<style lang="scss">
  .meta-data {
    width: 100%;
    height: 100%;
    user-select: none;

    @media (max-width: 800px) {
      display: flex;
      flex-direction: row;
      gap: 10px;
      padding: 10px;
    }
  }
</style>
