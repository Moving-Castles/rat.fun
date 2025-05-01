<script lang="ts">
  import { frozenRat } from "@components/Main/RoomResult/state.svelte"

  import Trait from "@components/Main/RoomResult/InfoBox/Rat/Trait.svelte"
  import Item from "@components/Main/RoomResult/InfoBox/Rat/Item.svelte"
</script>

<div class="rat-info-box">
  {#if $frozenRat}
    <!-- INFO -->
    <div class="column info">
      <!-- ID -->
      <div class="info-item">
        <span class="id">RAT #{$frozenRat.index}</span>
      </div>
      <!-- NAME -->
      <div class="info-item">
        <span class="name">{$frozenRat.name}</span>
      </div>
      <!-- IMAGE -->
      <div class="image-container">
        <img src="/images/rat.png" alt={$frozenRat.name} />
      </div>
      <div class="info-item">
        <!-- BALANCE -->
        <span class="balance">${$frozenRat.balance}</span>
        <!-- HEALTH -->
        <span class="health" class:dead={$frozenRat.health <= 0}
          >HEALTH {$frozenRat.health}</span
        >
      </div>
    </div>
    <!-- TRAITS -->
    <div class="column traits">
      <!-- HEADER -->
      <div class="header">
        <div class="label">Traits</div>
        <div class="counter">{$frozenRat?.traits.length}/5</div>
      </div>
      <!-- TRAITS -->
      {#each $frozenRat.traits as trait}
        <Trait {trait} />
      {/each}
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
        <Item {item} />
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
    width: calc(100% / 3);
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
      color: black;
      font-size: var(--font-size-small);
    }

    .name {
      background: var(--color-alert);
      padding: 5px;
      color: black;
    }

    .balance {
      background: var(--color-value);
      padding: 5px;
      color: black;
    }

    .health {
      background: var(--color-health);
      padding: 5px;
      color: black;

      &.dead {
        background: var(--color-death);
      }
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
