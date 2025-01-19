<script lang="ts">
  import { player, playerInventory } from "@svelte/modules/state/base/stores"
  import InventoryItem from "@components/Nest/Inventory/InventoryItem.svelte"
</script>

{#if $player && $playerInventory}
  <div class="inventory">
    <pre>Inventory (click item to equip)</pre>
    <div class="content">
      {#each $playerInventory as item, i}
        <InventoryItem {item} key={$player.inventory[i]} />
      {/each}
    </div>
  </div>
{/if}

<style lang="scss">
  .content {
    margin-top: 10px;
  }
</style>
