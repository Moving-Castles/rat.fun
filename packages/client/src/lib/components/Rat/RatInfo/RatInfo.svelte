<script lang="ts">
  import { rat } from "$lib/modules/state/stores"
  import { frozenRat, resetFrozenState } from "$lib/components/GameRun/state.svelte"
  import { RatStats, RatInventory, LiquidateRat } from "$lib/components/Rat"

  // Sync display rat to on-chain rat
  let displayRat = $state<Rat | null>(null)

  const updateDisplayRat = async () => {
    if (frozenRat) {
      // If we are coming back from a trip frozenRat is set
      displayRat = frozenRat

      await new Promise(resolve => setTimeout(resolve, 1000))

      displayRat = $rat

      resetFrozenState()
    } else {
      // Otherwise we just get the newest values directly
      displayRat = $rat
    }
  }

  updateDisplayRat()
</script>

<div class="rat-info">
  <!-- Stats -->
  <div class="rat-stats">
    <RatStats {displayRat} />
  </div>
  <!-- Inventory -->
  <div class="rat-inventory">
    <RatInventory {displayRat} />
  </div>
  <!-- Liquidate -->
  <div class="rat-liquidate">
    <LiquidateRat {displayRat} />
  </div>
</div>

<style lang="scss">
  .rat-info {
    display: flex;
    flex-direction: column;
    flex-shrink: 0;
    height: 100%;
    width: 100%;
    .rat-stats {
      display: flex;
      flex-direction: row;
      border-bottom: var(--default-border-style);
      overflow: hidden;
      height: 260px;

      @media (max-width: 700px) {
        height: 160px;
      }
    }

    .rat-inventory {
      width: 100%;
      border-bottom: var(--default-border-style);
      flex: 1; /* Take remaining space */
      overflow: hidden;
    }

    .rat-liquidate {
      height: var(--liquidate-rat-height);
      width: 100%;
      border-bottom: var(--default-border-style);
      flex-shrink: 0;
    }
  }
</style>
