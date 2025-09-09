<script lang="ts">
  import type { TempItem } from "$lib/components/Room/Trip/types"
  import { items } from "$lib/modules/state/stores"
  import { getItemState } from "$lib/components/Rat/RatBox/state.svelte"

  let {
    item
  }: {
    item: string | TempItem
  } = $props()

  let { item: itemState } = getItemState()

  let busy = $state(false)
  let isHovered = $state(false)

  // Item might be the id of an item or a TempItem object
  const name = $derived(typeof item === "string" ? ($items[item]?.name ?? "---") : item.name)
  const value = $derived(typeof item === "string" ? ($items[item]?.value ?? 0) : item.value)

  // Get the item ID for state management
  const itemId = $derived(typeof item === "string" ? item : item.id)
</script>

<button
  class="list-item"
  class:disabled={busy}
  onmouseenter={() => (isHovered = true)}
  onmouseleave={() => (isHovered = false)}
  onclick={() => {
    itemState.set(itemId)
  }}
>
  <div class="inner">
    <!-- NAME -->
    <div class="name">{name}</div>
    <!-- VALUE -->
    <span class="value" class:negative={value < 0}>${value}</span>
  </div>
</button>

<style lang="scss">
  .list-item {
    font-size: var(--font-size-normal);
    display: flex;
    background: var(--color-grey-dark);
    color: var(--foreground);
    padding: 5px;
    justify-content: center;
    align-items: center;
    border: none;
    outline: none;
    width: 100%;
    text-align: left;

    .value {
      color: var(--color-success);
      &.negative {
        color: var(--color-death);
      }
    }

    // &:hover {
    //   background: var(--color-death);
    //   color: var(--background);

    //   .value {
    //     color: var(--background);
    //   }
    // }
  }

  .inner {
    text-align: center;
  }
</style>
