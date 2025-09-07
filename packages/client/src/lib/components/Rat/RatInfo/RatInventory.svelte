<script lang="ts">
  import { rat } from "$lib/modules/state/stores"
  import { InteractiveItem } from "$lib/components/Rat"

  const MAX_INVENTORY_SIZE = 6

  // Create array with actual items + empty slots to fill 6 slots
  $: inventorySlots = (() => {
    const actualItems = $rat?.inventory ?? []
    const emptySlots = Array(MAX_INVENTORY_SIZE - actualItems.length).fill(null)
    return [...actualItems, ...emptySlots]
  })()
</script>

<div class="inventory">
  {#if $rat}
    <!-- HEADER -->
    <!-- <div class="header">
      <div
        class="label"
        use:tippy={{
          content: "Items carried by your rat. You can re-absorb them by clicking."
        }}
      >
        Inventory
      </div>
      <div class="counter">{$rat?.inventory?.length ?? 0}/{MAX_INVENTORY_SIZE}</div>
    </div> -->
    <div class="inventory-container">
      <!-- INVENTORY GRID -->
      {#each inventorySlots as item, index}
        {#if item}
          <InteractiveItem {item} />
        {:else}
          <div class="empty-slot"></div>
        {/if}
      {/each}
    </div>
  {/if}
</div>

<style lang="scss">
  .inventory {
    width: 100%;
    height: 100%;
    border-right: none;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    width: 100%;
    border-right: var(--dashed-border-style);
    overflow-x: hidden;
    overflow-y: scroll;
    background-image: url("/images/texture-2.png");
    background-size: 200px;
  }
  .header {
    border-bottom: var(--dashed-border-style);
    padding: 5px;
    display: flex;
    justify-content: space-between;
    background: var(--background-semi-transparent);
    font-size: var(--font-size-small);

    .label {
      font-size: var(--font-size-normal);
      color: white;
      position: relative;
    }

    .counter {
      font-size: var(--font-size-small);
      color: var(--color-grey-light);
      position: relative;
      top: 3px;
    }
  }

  .inventory-container {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    grid-template-rows: repeat(2, 1fr);
    gap: 8px;
    padding: 8px;
    height: 100%;
  }

  .empty-slot {
    background: rgba(0, 0, 0, 0.8);
    border: 2px solid black;
    min-height: 40px;
    opacity: 0.5;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;

    &::before {
      content: "EMPTY";
      color: rgba(255, 255, 255, 0.6);
      font-size: 14px;
      font-weight: bold;
      opacity: 0;
      transition: opacity 0.2s ease;
    }

    &:hover::before {
      opacity: 1;
    }
  }
</style>
