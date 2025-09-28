<script lang="ts">
  import { fade } from "svelte/transition"
  import { rat, ratInventory } from "$lib/modules/state/stores"
  import { InteractiveItem } from "$lib/components/Rat"
  import { collapsed } from "$lib/modules/ui/state.svelte"

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
          <div class="empty-slot" in:fade|global={{ duration: 100, delay: index * 50 }}></div>
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

  .empty-slot {
    background: rgba(0, 0, 0, 0.8);
    border: 2px solid black;
    min-height: 40px;
    opacity: 0.5;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;

    &::before {
      content: "EMPTY";
      color: rgba(255, 255, 255, 0.6);
      font-size: var(--font-size-normal);
      font-weight: bold;
      opacity: 0;
      transition: opacity 0.2s ease;
    }

    &:hover::before {
      opacity: 1;
    }
  }
</style>
