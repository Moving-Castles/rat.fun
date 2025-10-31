<script lang="ts">
  import { Tooltip } from "$lib/components/Shared"
  let { trip, maxValuePerWin }: { trip: Trip; maxValuePerWin: number } = $props()

  const isLowBalance = (trip: Trip, maxValuePerWin: number) => {
    /* ========================================
     * Currently, low balance is defined as:
     * - The trip has a balance less than or equal to the max value per win
     ======================================== */
    return Number(trip.balance) <= maxValuePerWin
  }
</script>

{#if isLowBalance(trip, maxValuePerWin)}
  <div class="meta-data-item max-win">
    <Tooltip content={`FOMO ALERT! Balance is ${trip.balance}`}>
      <div class="inner">🚨</div>
    </Tooltip>
  </div>
{/if}

<style lang="scss">
  .meta-data-item {
    background: rgba(255, 255, 255, 0.4);
    color: var(--background);
    margin-bottom: 5px;
    border-radius: 4px;
    font-size: var(--font-size-normal);
    display: flex;
    align-items: center;
    justify-content: center;
    height: 40px;

    .inner {
      padding: 10px;
    }
  }
</style>
