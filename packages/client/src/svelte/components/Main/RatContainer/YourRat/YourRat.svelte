<script lang="ts">
  import { player } from "@modules/state/base/stores"

  import RatInfo from "@components/Main/RatContainer/YourRat/RatInfo.svelte"
  import RatInventory from "@components/Main/RatContainer/YourRat/RatInventory.svelte"
  // import RatCam from "@components/Main/RatContainer/YourRat/RatCam.svelte"
  import LiquidateRat from "@components/Main/RatContainer/YourRat/LiquidateRat.svelte"
  import DeployRat from "@components/Main/RatContainer/DeployRat/DeployRat.svelte"
</script>

<div class="your-rat">
  <div class="your-rat-track">
    {#if $player?.ownedRat}
      <div class="your-rat-top">
        <div class="rat-main">
          <!-- Info -->
          <div class="rat-info">
            <RatInfo />
          </div>
          <!-- Cam -->
          <div class="rat-cam-container">
            <img src="/images/rat.png" alt="Rat Cam" />
            <!-- <RatCam /> -->
          </div>
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
      <!-- Bottom -->
    {:else}
      <DeployRat />
    {/if}
  </div>
</div>

<style lang="scss">
  .your-rat {
    display: flex;
    // flex-flow: column nowrap;
    height: 440px;
    width: 100%;
    overflow: hidden;

    .your-rat-track {
      width: 100%;
    }
  }

  .your-rat-top {
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

    .rat-cam-container {
      height: 100%;
      width: var(--rat-main-cam-width);
      overflow: hidden;
      border-left: var(--default-border-style);

      img {
        height: 100%;
        width: 100%;
        object-fit: cover;
      }
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
