<script lang="ts">
  import { getRatInventory } from "$lib/modules/state/utils"
  import { untrack } from "svelte"

  import InteractiveItem from "$lib/components/Rat/RatInfo/RatInventory/InteractiveItem.svelte"
  import EmptySlot from "$lib/components/Rat/RatInfo/RatInventory/EmptySlot.svelte"

  let { displayRat }: { displayRat: Rat | null } = $props()

  let inventory = $derived<Item[]>(displayRat ? getRatInventory(displayRat) : [])

  const MAX_INVENTORY_SIZE = 6
  const emptySlots = Array(MAX_INVENTORY_SIZE - (inventory?.length || 0)).fill(null)

  let inventorySlots = $state([...inventory, ...emptySlots])

  $effect(() => {
    // Fill the inventory slots after 1s
    setTimeout(() => {
      // console.log("after 2s")
      inventorySlots = [
        ...inventory,
        ...Array(MAX_INVENTORY_SIZE - (inventory?.length || 0)).fill(null)
      ]
    }, 1000)
  })
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
    gap: 6px;
    padding: 6px;
    flex-shrink: 0;
    box-sizing: border-box;
    grid-template-columns: repeat(3, 1fr);
    grid-template-rows: repeat(2, 1fr);
    height: 100%;
  }
</style>
