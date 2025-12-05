<script lang="ts">
  import { fade } from "svelte/transition"
  import { blockNumber } from "$lib/modules/network"

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
  <div class="meta-data-item max-win" transition:fade></div>
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
    height: 100%;
    width: 100%;
    position: absolute;
    top: 0;
    left: 0;
    mix-blend-mode: overlay;
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
