<script lang="ts">
  import { tippy } from "svelte-tippy"
  import { rat } from "$lib/modules/state/stores"

  import { Item } from "$lib/components/Shared"
</script>

<div class="rat-info-box">
  {#if $rat}
    <!-- INVENTORY -->
    <div class="column inventory">
      <!-- HEADER -->
      <div class="header">
        <div
          class="label"
          use:tippy={{
            content: "Items carried by your rat. You can re-absorb them by clicking."
          }}
        >
          Inventory
        </div>
        <div class="counter">{$rat?.inventory?.length ?? 0}/5</div>
      </div>
      <!-- INVENTORY -->
      {#each $rat?.inventory ?? [] as item}
        <Item {item} />
      {/each}
    </div>
  {/if}
</div>

<style lang="scss">
  .rat-info-box {
    width: 100%;
    height: 100%;
    border-right: none;
    overflow: hidden;
    display: flex;
  }

  .column {
    width: 100%;
    border-right: var(--dashed-border-style);
    overflow-x: hidden;
    overflow-y: scroll;
    background-image: url("/images/texture-3.png");
    background-size: 200px;
  }

  .header {
    border-bottom: var(--dashed-border-style);
    padding: 5px;
    display: flex;
    justify-content: space-between;
    font-size: var(--font-size-small);

    .counter {
      font-size: var(--font-size-small);
      color: var(--color-grey-light);
      position: relative;
      top: 3px;
    }
  }
</style>
