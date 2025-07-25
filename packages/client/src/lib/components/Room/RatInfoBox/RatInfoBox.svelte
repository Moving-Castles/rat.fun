<script lang="ts">
  import { frozenRat } from "$lib/components/Room/RoomResult/state.svelte"
  import { NumberGoing, Item } from "$lib/components/Shared"

  let balanceGoing = $state(false)
</script>

<div class="rat-info-box">
  {#if $frozenRat}
    <!-- INFO -->
    <div class="column info">
      <!-- ID -->
      <div class="info-item">
        <span class="id">RAT #{$frozenRat.index}</span>
      </div>
      <!-- IMAGE -->
      <div class="image-container">
        <img src={$frozenRat.image} alt={$frozenRat.name} />
      </div>
      <!-- NAME -->
      <div class="info-item">
        <span class="name">{$frozenRat.name}</span>
      </div>
      <div class="info-item">
        <!-- BALANCE -->
        <span class:priority={balanceGoing} class="balance"
          >$<NumberGoing bind:going={balanceGoing} value={$frozenRat.balance} /></span
        >
      </div>
    </div>
    <!-- INVENTORY -->
    <div class="column inventory">
      <!-- HEADER -->
      <div class="header">
        <div class="label">Inventory</div>
        <div class="counter">{$frozenRat?.inventory.length}/5</div>
      </div>
      <!-- INVENTORY -->
      {#each $frozenRat.inventory as item}
        <Item {item} isRoomInfoBox={true} />
      {/each}
    </div>
  {/if}
</div>

<style lang="scss">
  .rat-info-box {
    width: calc(50% - 50px);
    height: 100%;
    border: var(--default-border-style);
    border-right: none;
    overflow: hidden;
    display: flex;
    background-color: var(--background-semi-transparent);
    background-image: url("/images/texture-5.png");
    background-size: 200px;
  }

  .image-container {
    width: 100px;
    height: 100px;
    border: var(--default-border-style);
    margin: 10px;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }

  .column {
    width: calc(100% / 2);
    border-right: var(--dashed-border-style);
    overflow-x: hidden;
    overflow-y: scroll;

    &:last-child {
      border-right: none;
    }
  }

  .info-item {
    display: flex;
    margin: 10px;
    gap: 5px;

    .id {
      background: var(--color-grey-light);
      padding: 5px;
      color: var(--background);
      font-size: var(--font-size-small);
    }

    .name {
      background: var(--color-alert);
      padding: 5px;
      color: var(--background);
    }

    .balance {
      background: var(--color-value);
      padding: 5px;
      color: var(--background);
    }
  }

  .header {
    border-bottom: var(--dashed-border-style);
    padding: 10px;
    display: flex;
    justify-content: space-between;

    .counter {
      font-size: var(--font-size-small);
      color: var(--color-grey-light);
      position: relative;
      top: 3px;
    }
  }
</style>
