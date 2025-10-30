<script lang="ts">
  import { onMount } from "svelte"
  import { rat, ratInventory } from "$lib/modules/state/stores"
  import { ratState } from "$lib/components/Rat/state.svelte"

  import InteractiveItem from "$lib/components/Rat/RatInfo/RatInventory/InteractiveItem.svelte"
  import EmptySlot from "$lib/components/Rat/RatInfo/RatInventory/EmptySlot.svelte"

  const MAX_INVENTORY_SIZE = 6
  let emptySlots = $state(
    Array(MAX_INVENTORY_SIZE - (ratState.inventory.current?.length || 0)).fill(null)
  )

  let inventorySlots = $state([...ratState.inventory.current, ...emptySlots])

  onMount(() => {
    setTimeout(() => {
      emptySlots = Array(MAX_INVENTORY_SIZE - ($ratInventory?.length || 0)).fill(null)
      inventorySlots = [...$ratInventory, ...emptySlots]
    }, 3000)
  })
</script>

<div class="inventory">
  {#if $rat}
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
