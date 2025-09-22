<script lang="ts">
  import { rat } from "$lib/modules/state/stores"
  import { NumberGoing } from "$lib/components/Shared"
  import { ratImageUrl } from "$lib/modules/state/stores"

  $inspect($rat)

  import HealthBar from "./HealthBar.svelte"

  let balanceGoing = $state(false)
</script>

<div class="rat-info-box">
  {#if $rat}
    <!-- INFO -->
    <div class="info-container">
      <!-- INDEX -->
      <div class="info-item">
        <span class="index">RAT #{$rat.index}</span>
      </div>

      <!-- NAME -->
      <div class="info-item">
        <span class="name">{$rat.name}</span>
      </div>

      <!-- HEALTH -->
      <div class="info-item" class:priority={balanceGoing}>
        <span class="health">
          Health:
          <NumberGoing bind:going={balanceGoing} value={$rat.balance} />
        </span>
      </div>

      <!-- HEALTHBAR -->
      <div class="info-item">
        <HealthBar value={Number($rat.balance)} />
      </div>
    </div>

    <!-- IMAGE -->
    <div class="image-container">
      <img src={$ratImageUrl} alt={$rat.name} />
    </div>
  {/if}
</div>

<style lang="scss">
  .rat-info-box {
    width: 100%;
    height: 100%;
    border-right: none;
    overflow: hidden;
    display: flex;
    background-image: url("/images/texture-5.png");
    background-size: 100px;
    justify-content: space-between;

    .info-container {
      width: calc(100% - 260px);
      overflow: hidden;

      .info-item {
        width: 100%;
        height: 40px;
        border-bottom: var(--default-border-style);
        display: flex;
        align-items: center;
        justify-content: space-between;

        .index {
          padding-inline: 10px;
          color: var(--foreground);
          font-size: var(--font-size-small);
        }

        .name {
          padding-inline: 10px;
          color: var(--foreground);
          font-size: var(--font-size-normal);
          color: var(--foreground);
        }

        .health {
          padding-inline: 10px;
          color: var(--foreground);
          font-size: var(--font-size-normal);
        }
      }
    }
    .image-container {
      width: 260px;
      height: 100%;
      border: var(--default-border-style);

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        filter: grayscale(1);
        mix-blend-mode: screen;
      }
    }
  }
</style>
