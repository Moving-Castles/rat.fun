<script lang="ts">
  import { rat } from "$lib/modules/state/stores"
  import { NumberGoing } from "$lib/components/Shared"
  import { ratImageUrl } from "$lib/modules/state/stores"
  let balanceGoing = $state(false)
</script>

<div class="rat-info-box">
  {#if $rat}
    <!-- INFO -->
    <div class=" info">
      <!-- INDEX -->
      <div class="info-item">
        <span class="index">RAT #{$rat.index}</span>
      </div>

      <!-- NAME -->
      <div class="info-item">
        <span class="name">{$rat.name}</span>
      </div>

      <!-- BALANCE -->
      <div class="info-item" class:priority={balanceGoing}>
        <span class="balance">
          SLOPAMINE:
          <NumberGoing bind:going={balanceGoing} value={$rat.balance} />
        </span>
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
  }

  .info-item {
    display: flex;
    margin: 5px;
    margin-inline: 10px;
    gap: 5px;

    .index {
      background: var(--color-grey-light);
      padding: 5px;
      color: var(--background);
      font-size: var(--font-size-small);
    }

    .name {
      background: var(--color-alert);
      padding-right: 5px;
      color: var(--foreground);
      font-family: var(--label-font-stack);
      font-size: 32px;
      letter-spacing: -0.2em;
      color: var(--background);
    }

    .balance {
      background: var(--color-value);
      padding: 5px;
      color: var(--background);
    }
  }

  .image-container {
    width: 140px;
    height: 140px;
    // border: var(--default-border-style);
    margin: 10px;
    border-radius: 50%;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      border-radius: 50%;
    }
  }
</style>
