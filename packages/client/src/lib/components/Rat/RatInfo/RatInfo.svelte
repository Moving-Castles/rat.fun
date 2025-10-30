<script lang="ts">
  import { RatStats, RatInventory, LiquidateRat } from "$lib/components/Rat"
</script>

<div class="rat-info">
  <!-- Stats -->
  <div class="rat-stats">
    <RatStats />
  </div>
  <!-- Inventory -->
  <div class="rat-inventory">
    <RatInventory />
  </div>
  <!-- Liquidate -->
  <div class="rat-liquidate">
    <LiquidateRat />
  </div>
</div>

<style lang="scss">
  .rat-info {
    display: flex;
    flex-direction: column;
    flex-shrink: 0;
    height: 100%;
    width: 100%;
    user-select: none;

    .rat-stats {
      display: flex;
      flex-direction: row;
      border-bottom: var(--default-border-style);
      overflow: visible;
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
