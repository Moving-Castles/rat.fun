<script lang="ts">
  import { getRatInventory } from "$lib/modules/state/utils"

  import InteractiveItem from "$lib/components/Rat/RatInfo/RatInventory/InteractiveItem.svelte"
  import EmptySlot from "$lib/components/Rat/RatInfo/RatInventory/EmptySlot.svelte"

  let { displayRat }: { displayRat: Rat | null } = $props()

  let inventory = $derived<Item[]>(displayRat ? getRatInventory(displayRat) : [])

  const MAX_INVENTORY_SIZE = 6
  let emptySlots = $derived(Array(MAX_INVENTORY_SIZE - (inventory?.length || 0)).fill(null))

  let inventorySlots = $derived([...inventory, ...emptySlots])

  $inspect(inventorySlots)
</script>

<div class="inventory">
  {#if displayRat}
    <div class="inventory-container">
      <!-- INVENTORY GRID -->
      {#each inventorySlots as item, index (index)}
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
    display: grid;
    grid-template-columns: repeat(1fr, 3);
    // flex-direction: column;
    border-right: var(--dashed-border-style);
    overflow-x: hidden;
    overflow-y: scroll;
    background-image: url("/images/texture-2.png");
    background-size: 200px;
    height: 100%;
  }

  .inventory-container {
    display: grid;
    gap: 6px;
    padding: 6px;
    flex-shrink: 0;
    box-sizing: border-box;
    grid-template-columns: repeat(3, 1fr);
    grid-template-rows: repeat(2, 1fr);
    height: 100%;
  }

  :global(.index-0),
  :global(.index-3) {
    grid-column: 1/2;
  }

  :global(.index-1),
  :global(.index-4) {
    grid-column: 2/3;
  }
  :global(.index-2),
  :global(.index-5) {
    grid-column: 3/4;
  }

  :global(.index-0),
  :global(.index-1),
  :global(.index-2) {
    grid-row: 1/2;
  }

  :global(.index-3),
  :global(.index-4),
  :global(.index-5) {
    grid-row: 2/3;
  }
</style>
