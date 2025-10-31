<script lang="ts">
  import { fade } from "svelte/transition"
  import { blockNumber } from "$lib/modules/network"
  import { Tooltip } from "$lib/components/Shared"
  import { blocksToSeconds } from "$lib/modules/utils"

  let { trip }: { trip: Trip } = $props()

  const POPULAR_THRESHOLD_BLOCKS = 60 // about 2 minutes at 2 seconds per block

  const blocksSinceLastVisit = $derived(Number($blockNumber) - Number(trip.lastVisitBlock))

  const isPopular = (trip: Trip, blocksSinceLastVisit: number) => {
    /* ========================================
     * Currently, popularity is defined as:
     * - The trip has been visited in the last POPULAR_THRESHOLD_BLOCKS blocks
     ======================================== */
    const popular = blocksSinceLastVisit < POPULAR_THRESHOLD_BLOCKS

    // Should also consider:
    // trip.visitCount
    // ... and maybe:
    // trip.creationBlock

    return popular
  }
</script>

{#if isPopular(trip, blocksSinceLastVisit)}
  <div class="meta-data-item max-win" in:fade>
    <Tooltip content={`Last visited ${blocksToSeconds(blocksSinceLastVisit)} seconds ago`}>
      <div class="inner">HOT</div>
    </Tooltip>
  </div>
{/if}

<style lang="scss">
  .meta-data-item {
    background: #ffd700;
    animation: pulsatingFire 0.5s ease-in-out infinite;
    color: var(--background);
    margin-bottom: 5px;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: var(--font-size-normal);
    height: 40px;

    .inner {
      padding: 10px;
    }
  }

  @keyframes pulsatingFire {
    0%,
    100% {
      background: #ffd700; // yellow
    }
    33% {
      background: #ff8c42; // orange
    }
    66% {
      background: #ff6347; // red
    }
  }
</style>
