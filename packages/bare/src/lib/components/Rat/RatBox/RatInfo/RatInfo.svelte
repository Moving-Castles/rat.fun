<script lang="ts">
  import { ratImageUrl } from "$lib/modules/state/stores"

  import RatStats from "$lib/components/Rat/RatBox/RatInfo/RatStats.svelte"
  import RatInventory from "$lib/components/Rat/RatBox/RatInfo/RatInventory.svelte"
  import LiquidateRat from "$lib/components/Rat/RatBox/RatInfo/LiquidateRat.svelte"
</script>

<div class="rat-info">
  <div class="rat-main">
    <!-- Info -->
    <div class="rat-stats">
      <RatStats />
    </div>
    <!-- Rat image -->
    <button class="rat-image-container">
      <img src={$ratImageUrl} alt="Rat Cam" />
    </button>
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
    height: 440px;
    width: 100%;
  }

  .rat-main {
    display: flex;
    flex-direction: row;
    height: 100%;
    height: var(--rat-main-info-height);
    border-bottom: var(--default-border-style);
    overflow: hidden;

    .rat-image-container {
      border: none;
      padding: 0;
      height: 100%;
      width: var(--rat-main-cam-width);
      overflow: hidden;
      border-left: var(--default-border-style);
      cursor: pointer;

      img {
        height: 100%;
        width: 100%;
        object-fit: cover;
      }
    }

    .rat-stats {
      flex: 1;
    }
  }

  .rat-inventory {
    height: var(--rat-inventory-height);
    width: 100%;
    border-bottom: var(--default-border-style);
  }

  .rat-liquidate {
    height: var(--liquidate-rat-height);
    width: 100%;
    border-bottom: var(--default-border-style);
  }
</style>
