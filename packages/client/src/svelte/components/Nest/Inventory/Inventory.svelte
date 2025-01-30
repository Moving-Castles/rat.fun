<script lang="ts">
  import InventoryItem from "@components/Nest/Inventory/InventoryItem.svelte"

  export let isRat = false
  export let inventory: Item[]
  export let itemKeys: string[]

  const title = isRat
    ? "__ Load out (click item to dequip)"
    : "__ NEST Inventory (click item to equip)"
</script>

{#if inventory}
  <div class="inventory">
    <div class="title">{title}</div>
    <div class="content">
      {#if !inventory || inventory.length === 0}
        <div>** EMPTY **</div>
      {:else}
        {#each inventory as item, i}
          <InventoryItem {isRat} {item} key={itemKeys[i]} />
        {/each}
      {/if}
    </div>
  </div>
{/if}

<style lang="scss">
  .inventory {
    background: var(--color-grey-light);
    padding: 5px;
    color: var(--black);

    .content {
      margin-top: 5px;
    }
  }
</style>
