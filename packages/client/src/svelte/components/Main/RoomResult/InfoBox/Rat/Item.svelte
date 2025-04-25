<script lang="ts">
  import { items } from "@modules/state/base/stores"
  import type { TempItem } from "@components/Main/RoomResult/types"

  let { item }: { item: string | TempItem } = $props()

  // Item might be the id of an item or a TempItem object

  const name = $derived(
    typeof item === "string" ? ($items[item]?.name ?? "---") : item.name
  )

  const value = $derived(
    typeof item === "string" ? ($items[item]?.value ?? 0) : item.value
  )
</script>

<div class="list-item">
  <!-- NAME -->
  <div class="name">{name}</div>
  <!-- VALUE -->
  <div class="value" class:negative={value < 0}>${value}</div>
</div>

<style lang="scss">
  .list-item {
    font-size: var(--font-size-small);
    display: flex;
    gap: 10px;
    background: var(--color-grey-dark);
    padding: 5px;
    margin: 5px;
    justify-content: space-between;

    .value {
      color: var(--color-health);
      &.negative {
        color: var(--color-death);
      }
    }
  }
</style>
