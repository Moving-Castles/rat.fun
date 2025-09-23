<script lang="ts">
  import type { TempItem } from "$lib/components/Room/Trip/types"
  import { items } from "$lib/modules/state/stores"

  let {
    item
  }: {
    item: string | TempItem
  } = $props()

  let busy = $state(false)
  let isHovered = $state(false)

  // Item might be the id of an item or a TempItem object
  const name = $derived(typeof item === "string" ? ($items[item]?.name ?? "---") : item.name)
  const value = $derived(typeof item === "string" ? ($items[item]?.value ?? 0) : item.value)
</script>

<div
  class="list-item"
  class:disabled={busy}
  role="button"
  tabindex="0"
  onmouseenter={() => (isHovered = true)}
  onmouseleave={() => (isHovered = false)}
>
  <div class="inner">
    <!-- NAME -->
    <div class="name">{name}</div>
    <!-- VALUE -->
    <span class="value" class:negative={value < 0}>${value}</span>
  </div>
</div>

<style lang="scss">
  .list-item {
    font-size: var(--font-size-normal);
    display: flex;
    background: var(--color-grey-light);
    color: var(--background);
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
  }

  .inner {
    text-align: center;
  }
</style>
