<script lang="ts">
  import { rat, gameConfig } from "$lib/modules/state/stores"
  import { InteractiveItem } from "$lib/components/Rat"
  import { collapsed } from "$lib/modules/ui/state.svelte"

  // Create array with actual items + empty slots to fill 6 slots
  const inventorySlots = $derived.by(() => {
    const actualItems = $rat?.inventory ?? []
    const emptySlots = Array($gameConfig.maxInventorySize - actualItems.length).fill(null)
    return [...actualItems, ...emptySlots]
  })
</script>

<div class="inventory">
  {#if $rat}
    <div class="inventory-container" class:collapsed={$collapsed}>
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

  .inventory-container {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    grid-template-rows: repeat(2, 70px);
    gap: 8px;
    padding: 8px;
    flex-shrink: 0;
    height: 100%;

    &.collapsed {
      grid-template-columns: repeat(2, 1fr);
      grid-template-rows: repeat(3, 70px);
      height: 100%;
    }
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
