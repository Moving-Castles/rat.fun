<script lang="ts">
  import { rat, ratInventory } from "$lib/modules/state/stores"
  import { collapsed } from "$lib/modules/ui/state.svelte"
  import InteractiveItem from "$lib/components/Rat/RatInfo/RatInventory/InteractiveItem.svelte"
  import EmptySlot from "$lib/components/Rat/RatInfo/RatInventory/EmptySlot.svelte"

  const MAX_INVENTORY_SIZE = 6

  // Create array with actual items + empty slots to fill MAX_INVENTORY_SIZE slots
  const inventorySlots: (Item | null)[] = $derived.by(() => {
    const actualItems = $ratInventory ?? []
    const emptySlots = Array(MAX_INVENTORY_SIZE - actualItems.length).fill(null)
    return [...actualItems, ...emptySlots]
  })
</script>

<div class="inventory">
  {#if $rat}
    <div class="inventory-container" class:collapsed={$collapsed}>
      <!-- INVENTORY GRID -->
      {#each inventorySlots as item, index}
        {#if item}
          <InteractiveItem {item} {index} />
        {:else}
          <EmptySlot {index} />
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
    border-right: var(--dashed-border-style);
    overflow-x: hidden;
    overflow-y: scroll;
    background-image: url("/images/texture-2.png");
    background-size: 200px;
    height: 100%;
  }

  .inventory-container {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    grid-template-rows: repeat(3, 1fr);
    gap: 6px;
    padding: 6px;
    flex-shrink: 0;
    height: 100%;
    box-sizing: border-box;

    &.collapsed {
      grid-template-columns: repeat(3, 1fr);
      grid-template-rows: repeat(2, 1fr);
      height: 100%;
    }
  }
</style>
