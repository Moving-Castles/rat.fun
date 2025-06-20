<script lang="ts">
  import { tippy } from "svelte-tippy"
  import { rat } from "$lib/modules/state/base/stores"

  import Trait from "$lib/components/Main/Shared/Trait/Trait.svelte"
  import Item from "$lib/components/Main/Shared/Item/Item.svelte"
</script>

<div class="rat-info-box">
  {#if $rat}
    <!-- TRAITS -->
    <div class="column traits">
      <!-- HEADER -->
      <div
        class="header"
        use:tippy={{
          content: "Permanent personality traits of your rat.",
        }}
      >
        <div class="label">Traits</div>
        <div class="counter">{$rat?.traits?.length ?? 0}/5</div>
      </div>
      <!-- TRAITS -->
      {#each $rat?.traits ?? [] as trait}
        <Trait {trait} />
      {/each}
    </div>
    <!-- INVENTORY -->
    <div class="column inventory">
      <!-- HEADER -->
      <div class="header">
        <div
          class="label"
          use:tippy={{
            content:
              "Items carried by your rat. You can drop them by clicking on them.",
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
    width: 50%;
    border-right: var(--dashed-border-style);
    overflow-x: hidden;
    overflow-y: scroll;
    background-image: url("/images/texture-3.png");
    background-size: 200px;

    &:last-child {
      border-right: none;
    }
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
