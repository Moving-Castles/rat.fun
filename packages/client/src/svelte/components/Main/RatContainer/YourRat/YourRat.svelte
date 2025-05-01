<script lang="ts">
  import { player } from "@modules/state/base/stores"

  import RatInfo from "@components/Main/RatContainer/YourRat/RatInfo.svelte"
  import RatInventory from "@components/Main/RatContainer/YourRat/RatInventory.svelte"
  import RatCam from "@components/Main/RatContainer/YourRat/RatCam.svelte"
  import LiquidateRat from "@components/Main/RatContainer/YourRat/LiquidateRat.svelte"
  import DeployRat from "@components/Main/RatContainer/DeployRat/DeployRat.svelte"
  // import FloorProgress from "@components/Main/RatContainer/YourRat/FloorProgress.svelte"
</script>

<div class="your-rat">
  {#if $player?.ownedRat}
    <div class="your-rat-top">
      <div class="rat-main">
        <!-- Info -->
        <div class="rat-info">
          <RatInfo />
        </div>
        <!-- Cam -->
        <div class="rat-cam">
          <RatCam />
        </div>
      </div>
      <!-- Inventory -->
      <div class="rat-inventory">
        <RatInventory />
      </div>
      <!-- <FloorProgress /> -->
      <!-- Liquidate -->
      <div class="rat-liquidate">
        <LiquidateRat />
      </div>
    </div>
    <!-- Bottom -->
    <div class="your-rat-bottom"></div>
  {:else}
    <DeployRat />
  {/if}
</div>

<style lang="scss">
  .your-rat {
    display: flex;
    flex-direction: column;
    height: 100%;
    position: relative;
  }

  .your-rat-top {
    display: flex;
    flex-direction: column;
    flex-shrink: 0;
  }

  .your-rat-bottom {
    display: flex;
    flex-direction: column;
    flex: 1;
    background-image: url("/images/bg-test.jpg");
    background-size: 200px;
    background-position: center;
    opacity: 0.5;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }

  .rat-main {
    display: flex;
    flex-direction: row;
    height: 100%;
    height: var(--rat-main-info-height);
    border-bottom: var(--default-border-style);

    .rat-cam {
      height: 100%;
      width: var(--rat-main-cam-width);
    }

    .rat-info {
      flex: 1;
    }
  }

  .rat-inventory {
    height: var(--rat-inventory-height);
    width: 100%;
    border-bottom: var(--default-border-style);
  }

  .rat-liquidate {
    height: var(--rat-liquidate-height);
    width: 100%;
    border-bottom: var(--default-border-style);
  }
</style>
