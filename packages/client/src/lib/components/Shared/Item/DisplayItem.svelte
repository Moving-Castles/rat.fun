<script lang="ts">
  import type { TempItem } from "$lib/components/Room/Trip/types"
  import { items } from "$lib/modules/state/stores"

  let {
    item
  }: {
    item: string | TempItem
  } = $props()

  // Item might be the id of an item or a TempItem object
  const name = $derived(typeof item === "string" ? ($items[item]?.name ?? "---") : item.name)
  const value = $derived(typeof item === "string" ? ($items[item]?.value ?? 0) : item.value)
</script>

<div class="list-item">
  <!-- NAME -->
  <div class="name">{name}</div>
  <!-- VALUE -->
  <span class="value" class:negative={value < 0}>${value}</span>
</div>

<style lang="scss">
  .list-item {
    font-size: var(--font-size-small);
    display: flex;
    gap: 10px;
    background: var(--color-grey-dark);
    color: var(--foreground);
    padding: 5px;
    margin: 5px;
    justify-content: space-between;
    border: none;
    outline: none;
    width: calc(100% - 10px);
    cursor: default;
    text-align: left;

    .value {
      color: var(--color-success);
      &.negative {
        color: var(--color-death);
      }
    }
  }
</style>
