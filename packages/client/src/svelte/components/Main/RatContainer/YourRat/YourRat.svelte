<script lang="ts">
  import { player, ratImageUrl } from "@modules/state/base/stores"
  import { getModalState } from "@components/Main/Modal/state.svelte"
  import ModalTarget from "@components/Main/Modal/ModalTarget.svelte"

  import RatInfo from "@components/Main/RatContainer/YourRat/RatInfo.svelte"
  import RatInventory from "@components/Main/RatContainer/YourRat/RatInventory.svelte"
  import LiquidateRat from "@components/Main/RatContainer/YourRat/LiquidateRat.svelte"
  import DeployRat from "@components/Main/RatContainer/DeployRat/DeployRat.svelte"
  // import RatCam from "@components/Main/RatContainer/YourRat/RatCam.svelte"

  let { modal } = getModalState()
  let showRatModal = $state(false)
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
          <!-- svelte-ignore a11y_click_events_have_key_events -->
          <!-- svelte-ignore a11y_no_static_element_interactions -->
          <div class="rat-cam-container" onclick={() => (showRatModal = true)}>
            <img src={$ratImageUrl} alt="Rat Cam" />
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

{#snippet ratModal()}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div class="rat-modal" onclick={() => modal.close()}>
    <img src={$ratImageUrl} alt="Rat" />
  </div>
{/snippet}

{#if showRatModal}
  <ModalTarget
    fullscreen={true}
    onclose={() => (showRatModal = false)}
    content={ratModal}
  />
{/if}

<style lang="scss">
  .your-rat {
    display: flex;
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
      cursor: pointer;

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
    height: var(--liquidate-rat-height);
    width: 100%;
    border-bottom: var(--default-border-style);
  }

  .rat-modal {
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;

    img {
      max-width: 90%;
      max-height: 90%;
      object-fit: contain;
      border: var(--default-border-style);
    }
  }
</style>
